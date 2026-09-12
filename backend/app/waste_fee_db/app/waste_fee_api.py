import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from .waste_fee_db import get_waste_fee_session

waste_fee_router = APIRouter(prefix="/api/v1/waste-fees", tags=["전국 실제 수수료"])
DB = Annotated[Session, Depends(get_waste_fee_session)]


class WasteFeeDataset(BaseModel):
    id: int
    source_name: str
    imported_at: str
    row_count: int


class WasteFeeItem(BaseModel):
    id: int
    import_id: int
    province: str
    district: str
    item_name: str
    category: str
    size_label: str
    paid_free: str
    fee_raw: str
    amount_krw: int | None
    managing_organization: str
    reference_date: str
    provider_code: str
    provider_name: str


class WasteFeePage(BaseModel):
    dataset: WasteFeeDataset
    total: int
    limit: int
    offset: int
    items: list[WasteFeeItem]


class WasteFeeRegion(BaseModel):
    province: str
    district: str


class WasteFeeRegions(BaseModel):
    dataset: WasteFeeDataset
    items: list[WasteFeeRegion]


def get_waste_fee_dataset(db, import_id):
    where = "WHERE id=:id" if import_id is not None else "ORDER BY id DESC LIMIT 1"
    row = db.execute(text(f"SELECT id,source_name,imported_at,row_count FROM waste_file_imports {where}"),
                     {"id": import_id}).mappings().first()
    if row is None:
        raise HTTPException(404, detail={"code": "DATASET_NOT_FOUND", "message": "수집 자료가 없습니다"})
    return dict(row)


MAPPING = {"province": "시도명", "district": "시군구명", "item_name": "대형폐기물명",
           "category": "대형폐기물구분명", "size_label": "대형폐기물규격", "paid_free": "유무료여부",
           "fee_raw": "수수료", "managing_organization": "관리기관명", "reference_date": "데이터기준일자",
           "provider_code": "제공기관코드", "provider_name": "제공기관명"}


def serialize_waste_fee(row):
    item = {name: "" if row[col] is None else str(row[col]) for name, col in MAPPING.items()}
    raw = item["fee_raw"].strip()
    item.update(id=row["id"], import_id=row["import_id"], amount_krw=(
        int(raw.replace(",", "")) if re.fullmatch(r"(?:\d+|\d{1,3}(?:,\d{3})+)", raw) else None))
    return item


@waste_fee_router.get("/regions", response_model=WasteFeeRegions)
def list_waste_fee_regions(db: DB, import_id: int | None = Query(None, ge=1)):
    source = get_waste_fee_dataset(db, import_id)
    rows = db.execute(text('''SELECT DISTINCT "시도명" AS province, "시군구명" AS district
        FROM waste_standard_data WHERE import_id=:id ORDER BY "시도명", "시군구명"'''),
        {"id": source["id"]}).mappings().all()
    return {"dataset": source, "items": rows}


@waste_fee_router.get("", response_model=WasteFeePage)
def search_waste_fees(db: DB, province: str | None = Query(None, min_length=1, max_length=100),
           district: str | None = Query(None, min_length=1, max_length=100),
           q: str | None = Query(None, min_length=1, max_length=100),
           import_id: int | None = Query(None, ge=1),
           limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    if district and not province:
        raise HTTPException(422, detail={"code": "PROVINCE_REQUIRED", "message": "시군구 검색에는 시도명이 필요합니다"})
    source = get_waste_fee_dataset(db, import_id)
    conditions, params = ["import_id=:batch"], {"batch": source["id"], "limit": limit, "offset": offset}
    for value, column, key in [(province, "시도명", "province"), (district, "시군구명", "district")]:
        if value is not None:
            conditions.append(f'"{column}"=:{key}')
            params[key] = value.strip()
    if q is not None:
        if not q.strip():
            raise HTTPException(422, detail={"code": "EMPTY_QUERY", "message": "검색어를 입력하세요"})
        conditions.append('"대형폐기물명" LIKE :q ESCAPE \'!\'')
        params["q"] = '%' + q.strip().replace('!', '!!').replace('%', '!%').replace('_', '!_') + '%'
    where = ' AND '.join(conditions)
    total = db.scalar(text(f'SELECT count(*) FROM waste_standard_data WHERE {where}'), params)
    rows = db.execute(text(f'''SELECT * FROM waste_standard_data WHERE {where}
        ORDER BY "시도명", "시군구명", "대형폐기물명", "대형폐기물규격", id LIMIT :limit OFFSET :offset'''), params).mappings()
    return {"dataset": source, "total": total, "limit": limit, "offset": offset,
            "items": [serialize_waste_fee(row) for row in rows]}


@waste_fee_router.get("/{item_id}", response_model=WasteFeeItem)
def get_waste_fee_detail(item_id: int, db: DB):
    row = db.execute(text('SELECT * FROM waste_standard_data WHERE id=:id'), {"id": item_id}).mappings().first()
    if row is None:
        raise HTTPException(404, detail={"code": "ITEM_NOT_FOUND", "message": "품목이 없습니다"})
    return serialize_waste_fee(row)
