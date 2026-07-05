"""
Minimiza los datos antes de enviarlos a proveedores de IA.
Nunca envía: nombre, correo, teléfono, UID, URL de archivo.
"""


def minimize_person(person: dict) -> dict:
    """Devuelve solo datos anónimos necesarios para IA."""
    return {
        "alias": "Paciente",
        "age_range": _age_range(person.get("ageApprox")),
        "biological_sex": person.get("biologicalSex") if person.get("biologicalSex") not in ("prefiero_no_decir", None) else None,
    }


def minimize_document(doc: dict, extracted_text: str | None = None) -> dict:
    return {
        "category": doc.get("category"),
        "document_date": doc.get("documentDate"),
        "extracted_preview": extracted_text[:2000] if extracted_text else None,
    }


def minimize_lab_results(results: list[dict]) -> list[dict]:
    return [
        {
            "indicator": r.get("indicatorName"),
            "value": r.get("value"),
            "unit": r.get("unit"),
            "reference_min": r.get("referenceMin"),
            "reference_max": r.get("referenceMax"),
            "status": r.get("status"),
        }
        for r in results
    ]


def _age_range(age: int | None) -> str | None:
    if age is None:
        return None
    if age < 2:
        return "lactante"
    if age < 12:
        return "niño"
    if age < 18:
        return "adolescente"
    if age < 60:
        return "adulto"
    return "adulto mayor"
