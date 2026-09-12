import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.waste_fee_db import get_waste_fee_session
from app.waste_fee_module import create_waste_fee_app

app = create_waste_fee_app()
from app.waste_fee_api import MAPPING


@pytest.fixture
def web_client(db):
    db.execute(text('CREATE TABLE waste_file_imports (id INTEGER PRIMARY KEY, source_name TEXT, imported_at TEXT, row_count INTEGER)'))
    cols = ','.join(f'"{col}" TEXT' for col in MAPPING.values())
    db.execute(text(f'CREATE TABLE waste_standard_data (id INTEGER PRIMARY KEY, import_id INTEGER,{cols})'))
    db.execute(text("INSERT INTO waste_file_imports VALUES (1,'old.xls','2026-01-01',1),(2,'new.xls','2026-09-12',3)"))
    for item_id, batch, province, name, price in [(1,1,'서울특별시','옛 품목','100'),
        (2,2,'서울특별시','소파','3,000'),(3,2,'서울특별시','소파 100%','별도문의'),
        (4,2,'부산광역시','소파','5000')]:
        db.execute(text('''INSERT INTO waste_standard_data
            (id,import_id,"시도명","시군구명","대형폐기물명","수수료","대형폐기물규격")
            VALUES (:id,:batch,:province,'테스트구',:name,:price,'1인용')'''),
            dict(id=item_id,batch=batch,province=province,name=name,price=price))
    db.commit()
    app.dependency_overrides[get_waste_fee_session] = lambda: db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_latest_dataset_filter_paging(web_client):
    result = web_client.get('/api/v1/waste-fees', params={'province':'서울특별시','q':'소파','limit':1}).json()
    assert result['dataset']['id'] == 2 and result['total'] == 2
    assert result['items'][0]['amount_krw'] == 3000
    assert len(result['items']) == 1
    assert web_client.get('/api/v1/waste-fees',params={'import_id':1}).json()['items'][0]['id']==1


def test_literals_unknown_fee_and_detail(web_client):
    result = web_client.get('/api/v1/waste-fees',params={'q':'%'}).json()
    assert result['total']==1 and result['items'][0]['amount_krw'] is None
    assert web_client.get('/api/v1/waste-fees/3').json()['fee_raw']=='별도문의'
    assert web_client.get('/api/v1/waste-fees',params={'q':"' OR 1=1 --"}).json()['total']==0
    assert web_client.get('/api/v1/waste-fees/999').status_code==404


def test_validation_and_regions(web_client):
    assert len(web_client.get('/api/v1/waste-fees/regions').json()['items'])==2
    for params in [{'limit':101},{'offset':-1},{'district':'테스트구'},{'q':' '}]:
        assert web_client.get('/api/v1/waste-fees',params=params).status_code==422
    assert web_client.get('/api/v1/waste-fees',params={'import_id':999}).status_code==404


def test_cors_and_demo(web_client):
    allowed=web_client.options('/api/v1/waste-fees',headers={'Origin':'http://localhost:5500','Access-Control-Request-Method':'GET'})
    assert allowed.status_code==200
    assert allowed.headers['access-control-allow-origin']=='http://localhost:5500'
    denied=web_client.options('/api/v1/waste-fees',headers={'Origin':'https://unknown.example','Access-Control-Request-Method':'GET'})
    assert 'access-control-allow-origin' not in denied.headers
    assert web_client.get('/waste-fees/demo').status_code==200
