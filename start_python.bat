@echo off
echo ===================================================
echo   Starting Folioblox Python FastAPI Backend Server
echo ===================================================
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
pause

