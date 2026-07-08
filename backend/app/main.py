from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.db_test import router as db_test_router
from app.api.uploads import router as uploads_router
from fastapi.staticfiles import StaticFiles
from app.api.campaigns import router as campaigns_router
from app.api.health import router as health_router

app = FastAPI(
    title="Braind API",
    description="Backend API for Braind, a multimodal AI campaign generation and evaluation platform.",
    version="0.1.0",
)

app.mount(
    "/generated-images",
    StaticFiles(directory="generated_images"),
    name="generated-images",
)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(campaigns_router, prefix="/api")
app.include_router(db_test_router, prefix="/api")
app.include_router(uploads_router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Braind API is running",
        "status": "healthy",
    }