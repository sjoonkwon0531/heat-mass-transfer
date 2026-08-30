# 배포 가이드 — heat-mass-transfer

빈 레포지토리 `sjoonkwon0531/heat-mass-transfer`에 이 패키지를 올리고
Vercel에 연결하는 절차입니다. 1학기 유체역학 사이트와 동일한 방식입니다.

## 1단계 — 압축 해제 후 GitHub에 push

```bash
# 압축을 푼 폴더로 이동
cd heat-mass-transfer

git init
git add .
git commit -m "Week 1: Intro to Heat & Mass Transfer (hub + interactive module)"
git branch -M main
git remote add origin https://github.com/sjoonkwon0531/heat-mass-transfer.git
git push -u origin main
```

> `node_modules/`와 `dist/`는 `.gitignore`에 이미 등록되어 있어 올라가지 않습니다.

## 2단계 — Vercel 연결 (최초 1회)

1. https://vercel.com → **Add New… → Project**
2. GitHub 계정에서 `heat-mass-transfer` 레포 **Import**
3. Framework Preset이 **Vite**로 자동 감지되는지 확인
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy** 클릭 → 1–2분 후 `heat-mass-transfer-*.vercel.app` 주소 발급

이후에는 `git push`만 하면 Vercel이 자동으로 재배포합니다.

## 3단계 — 동작 확인 체크리스트

- [ ] 허브 화면: 16주 카드 표시, Week 1만 클릭 가능(주황색), 한/영 토글
- [ ] Week 1 → "통일된 지배방정식" 탭: ▶ 실행 시 세 곡선이 다른 속도로 확산
- [ ] "분자적 기원" 탭: random walk 히스토그램이 주황 Gaussian 곡선에 수렴
- [ ] "Raw 코드" 탭: 4주제 × 4언어 전환, Copy / Download 버튼 동작
- [ ] 모바일(좁은 화면)에서 카드가 1열로 재배열되는지

## 로컬 미리보기 (선택)

```bash
npm install
npm run dev      # http://localhost:5173
```

## 다음 주차 추가 시

`README.md`의 "새 주차 추가 방법 (3단계)" 참조 — Week2App.jsx 작성 후
App.jsx의 import / weeks 배열 / comps 세 곳만 수정하고 push하면 됩니다.
