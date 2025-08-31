@echo off
chcp 65001 >nul
set PYTHONIOENCODING=utf-8
python crawl4ai_runner.py %*
