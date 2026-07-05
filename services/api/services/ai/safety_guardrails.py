MEDICAL_DISCLAIMER = (
    "\n\n⚕️ *Esta explicación es solo orientativa y no reemplaza la valoración de un médico. "
    "Los rangos pueden variar según el laboratorio, la edad, el sexo y el contexto clínico.*"
)

FORBIDDEN_PATTERNS = [
    "tienes", "padeces", "sufres de", "diagnóstico es",
    "debes tomar", "suspende el medicamento", "inicia tratamiento",
    "te recomiendo el medicamento", "definitivamente tienes",
]


def add_disclaimer(text: str) -> str:
    return text + MEDICAL_DISCLAIMER


def check_safety(text: str) -> dict:
    """Detecta lenguaje prohibido en respuestas de IA."""
    flags = [p for p in FORBIDDEN_PATTERNS if p in text.lower()]
    return {"safe": len(flags) == 0, "flags": flags}
