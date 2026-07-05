# AppMiSalud Familia

Bóveda médica familiar inteligente — organiza, consulta y comparte documentos médicos de forma segura.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Python + FastAPI
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Authentication
- **Archivos**: Firebase Storage
- **IA**: DeepSeek + OpenAI + Grok (capa multi-proveedor)

## Estructura

```
/appmisalud-familia
  /apps/web          → Next.js frontend
  /services/api      → FastAPI backend
  /packages/shared   → Tipos y utilidades compartidas
  /firebase          → Reglas Firestore y Storage
  /docs              → Documentación técnica
```

## Inicio rápido

Ver [docs/setup.md](docs/setup.md).

## Principio fundamental

La IA ayuda a organizar y explicar — **nunca diagnostica ni reemplaza al médico.**
