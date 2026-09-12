CREATE TABLE waste_file_imports (
            id INTEGER PRIMARY KEY, sha256 TEXT NOT NULL UNIQUE, source_name TEXT NOT NULL,
            imported_at TEXT NOT NULL, row_count INTEGER NOT NULL);
CREATE TABLE waste_standard_data (
            id INTEGER PRIMARY KEY, import_id INTEGER NOT NULL REFERENCES waste_file_imports(id),
            source_sheet TEXT NOT NULL, source_row INTEGER NOT NULL,
            "시도명", "시군구명", "대형폐기물명", "대형폐기물구분명", "대형폐기물규격", "유무료여부", "수수료", "관리기관명", "데이터기준일자", "제공기관코드", "제공기관명", UNIQUE(import_id, source_sheet, source_row));
CREATE TABLE waste_fee_api_source (import_id INTEGER NOT NULL REFERENCES waste_file_imports(id), row_number INTEGER NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(import_id,row_number));
CREATE INDEX ix_waste_standard_region_item
            ON waste_standard_data(import_id, "시도명", "시군구명", "대형폐기물명");
