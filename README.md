# 심플미디어플레이어

> Flask 백엔드와 연동하여 자막 전사, 번역, 트랜스코딩, 영상 라이브러리 UI 등을 제공하는 것을 목표로 합니다.

![image](https://github.com/user-attachments/assets/2ff81315-60c9-49a9-a1e9-5e740a8dc4f5)

---

## 기술 스택

- **Frontend**: Javascript, React, React-bootstrap  
- **Backend**: Python (Flask)  
- **자막 전사**: OpenAI Whisper  
- **자막 번역**: Local LLM  
- **트랜스코딩**: FFmpeg  
- **데이터베이스**

---

## 구현 목표

### Font  

#### 동영상 플레이어

- [x] 커스텀 UI  
  - [x] 반투명 컨트롤  
  - [x] 키보드 조작  
  - [x] 프로그레스바 조작  
  - [x] 드래그하여 재생 시간 변경  
  - [x] 재생시간 이동 중 영상 새로고침  
  - [x] 볼륨바  
  - [x] 재생/일시정지 버튼  
  - [x] 자막 On/Off 버튼  
  - [x] 자막 선택 버튼 Overlay  
  - [ ] 자막 전사 버튼 Overlay  
  - [ ] 자막 번역 버튼 Overlay  
  - [ ] 자막 스타일 설정 기능  
  - [ ] 트랜스코딩 기능  
  - [x] 전체화면 버튼  
  - [x] PIP 버튼  

#### 영상 라이브러리 UI

- [ ] 익스플로러 구현  
- [ ] 섬네일 표시

---

### Back  

#### 서버

- [x] Flask 개발 서버  
- [x] Restful API  

#### 개선된 자막 기능

- [x] 기존 자막 추출  
- [ ] 전사 자막 생성  
  - [ ] Whisper 이용  
- [ ] 번역 자막 생성  
  - [ ] Local LLM 모델 이용  

#### 트랜스코딩

#### 영상 라이브러리 기능 (Like Jellyfin?)

- [ ] 영상 라이브러리 DB 제작  
  - [ ] 스키마 설계

---

## 프로젝트 구조

Frontend 폴더에는 프론트 소스 및 빌드 포함. 모듈은 용량 관계상 삭제하였음으로, 빌드시 React와 React-bootstrap 설치가 필요합니다.  
app.py에 모든 백엔드 기능 구현하였습니다. 추후 확장 예정입니다.  
비디오는 일단은 /server/video/video.mp4로 위치하여야 합니다.  

---

## 실행

```bash
pip install -r requirements.txt
python app.py
```
Python 3.13.2. 환경에서 테스트 되었습니다.
