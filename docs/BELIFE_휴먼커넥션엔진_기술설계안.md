# BELIFE 휴먼커넥션 엔진 기술설계안
## 사회학 · 관계과학 · 통계네트워크 · 메모리 시스템 기반 설계

## 1. 문서 목적
이 문서는 BELIFE의 기존 개인화 온톨로지/디지털 트윈/멘탈 상태 분석 엔진 위에 올릴 **휴먼커넥션 엔진**의 기술 설계안을 정리한다. 목표는 단순 매칭이나 취향 추천이 아니라, **깊고 건강하며 유지 가능한 관계 가능성**을 구조적으로 분석하고 시뮬레이션하는 것이다.

BELIFE의 휴먼커넥션 엔진은 세 가지 질문에 답해야 한다.

1. 이 두 사람은 **왜** 잘 맞을 가능성이 있는가?
2. 이 두 사람은 어떤 상황에서 **어긋날** 가능성이 있는가?
3. 이 관계는 장기적으로 **안심할 수 있고 유지 가능한 관계**가 될 수 있는가?

이 문서는 위 질문에 답하기 위해 사회과학과 관계과학의 검증된 틀을 BELIFE에 맞게 번역한다.

---

## 2. 제품 철학: BELIFE의 휴먼커넥션은 무엇을 평가하는가
BELIFE는 사람을 단순 취향, 외형, 몇 줄의 프로필, 표면적 관심사로 연결하지 않는다. BELIFE는 먼저 한 사람의 구조를 이해하고, 그 구조를 바탕으로 관계 가능성을 분석한다.

BELIFE가 찾고자 하는 관계는 단순히 “잘 맞는 사람”이 아니다. 아래 세 조건을 동시에 만족하는 관계가 핵심이다.

- **편안함**: 가치관, 이해 방식, 감정 리듬이 어느 정도 맞는다.
- **끌림**: 서로 다른 점이 보완적으로 작동해 에너지와 흥미를 만든다.
- **지속 가능성**: 갈등, 오해, 압박 상황에서도 관계가 무너지지 않고 회복될 수 있다.

즉 BELIFE는 “유사성”만 보지 않고, **유사성 + 보완성 + 대화 적합성 + 회복 가능성**을 함께 본다.

---

## 3. 학술적 기반

### 3.1. 사회적 연결의 질: CDCS를 BELIFE식으로 번역
Okabe-Miyamoto et al.는 2024년 PLOS ONE 논문에서 대화 단위 사회적 연결감을 측정하기 위한 **Connection During Conversations Scale (CDCS)**를 제안했다. 이 척도는 특정 대화/상호작용에서의 연결감을 측정하며, 확인적 요인분석을 통해 네 가지 하위요인을 도출했다: **Shared Reality, Partner Responsiveness, Participant Interest, Affective Experience**. 해당 척도는 loneliness, partner responsiveness, relatedness, positivity resonance, shared reality 등 기존 관련 척도와 유의한 상관을 보였고, 연구자들은 “상호작용/대화 단위 연결감”을 측정하는 도구가 필요하다고 강조했다. [1]

BELIFE에선 CDCS를 그대로 설문으로만 쓰지 않고, 다음과 같이 **대화 행위와 시뮬레이션 결과의 품질 축**으로 번역한다.

- **Shared Reality** → 서로 같은 맥락과 의미를 공유하고 있다고 느끼는 정도
- **Responsiveness** → 상대가 나를 이해하고, 가치 있게 여기고, 반응한다고 느끼는 정도
- **Interest** → 대화가 살아 있고, 상호 관심이 유지되는 정도
- **Affective Experience** → 정서적으로 편안하고 자연스러운 감정 경험이 형성되는 정도

BELIFE는 이 네 축을 Human Connection 출력의 핵심 리포트 축으로 사용한다.

### 3.2. 유사성과 지각된 유사성
Montoya et al.의 메타분석은 **actual similarity**와 **perceived similarity** 모두 대인 매력과 관련되며, 특히 기존 관계에서는 지각된 유사성이 더 중요할 수 있음을 보여준다. 즉 실제로 비슷한 것뿐 아니라, “상대가 나를 이해할 것처럼 느껴지는가”가 중요하다. [2]

BELIFE는 이 결과를 바탕으로:
- 실제 구조 유사성(온톨로지 기반)
- 지각된 이해 가능성(대화 적합성/공감 가능성 기반)
을 분리해서 모델링한다.

### 3.3. 관계 유지의 핵심: Vulnerability-Stress-Adaptation(VSA)
Karney & Bradbury의 VSA 모델은 관계 질과 안정성을 설명할 때, 세 가지를 함께 봐야 한다고 제안한다.
- **Enduring vulnerabilities**: 개인의 지속적 취약성/특성
- **Stressful events**: 외부 스트레스
- **Adaptive processes**: 갈등 대처, 의사소통, 문제 해결 같은 적응 과정 [3]

BELIFE는 이 틀을 그대로 차용할 수 있다.
- 개인 온톨로지 = enduring vulnerabilities / stable structure
- 상황 시나리오 = stressful events
- 관계 시뮬레이션 반응 = adaptive processes

즉 BELIFE 관계 시뮬레이션은 “좋은 사람 찾기”가 아니라 **취약성-스트레스-적응의 동학을 보는 엔진**이 된다.

### 3.4. Dyadic Coping: 둘이 함께 스트레스를 다루는 능력
Falconier et al.의 메타분석은 **dyadic coping**이 관계 만족과 유의미하게 관련되어 있음을 보여준다. 즉 스트레스를 각자 견디는 것이 아니라, **둘이 함께 스트레스에 반응하는 방식**이 관계 만족에 중요하다. [4]

BELIFE는 이를 다음처럼 반영한다.
- 스트레스 상황에서 서로를 안정시키는가?
- 상대의 어려움을 “개인 문제”가 아니라 “함께 다룰 문제”로 반응하는가?
- 긴장 상황에서 회피/비난/철수로 가는가, 아니면 정리/공감/수리로 가는가?

이는 BELIFE의 **Stress Response / Repair Compatibility** 축의 이론적 뼈대가 된다.

### 3.5. 네트워크는 우연이 아니라 구조로 생긴다: ERGM/TERGM/btergm
`ergm`는 네트워크 데이터를 위한 통계적 모델링 도구로, **Exponential Random Graph Models**를 적합/시뮬레이션/진단하는 패키지다. 공식 문서는 ERGM이 사회 네트워크의 복잡한 의존성을 인식하며, 시뮬레이션과 적합도 검정까지 제공한다고 설명한다. [5] `tergm`는 여기에 **시간에 따라 진화하는 네트워크**를 모델링하고, formation/persistence/dissolution을 분리해 다룰 수 있게 확장한다. [6] `btergm`는 TERGM을 bootstrap pseudolikelihood로 추정하고, bootstrap confidence interval과 micro-level interpretation까지 제공한다. [7]

BELIFE에 이 계열이 주는 중요한 통찰은 다음과 같다.
- 관계 형성은 단순 pair 점수의 합이 아니라 **네트워크 구조의 결과**다.
- 중요한 메커니즘은 homophily, reciprocity, transitivity, closure, persistence다.
- 시간이 지남에 따라 edge는 생기고, 유지되고, 사라진다.

즉 BELIFE는 pairwise compatibility만 보는 게 아니라, **숨은 관계 그래프가 어떤 통계적 메커니즘으로 자라는지**도 모델링해야 한다.

---

## 4. BELIFE 휴먼커넥션 엔진의 4층 구조

### Layer 1. Personal Ontology Layer
이미 BELIFE에 있는 구조다.
- Value
- Belief
- Goal
- EmotionPattern
- DecisionPattern
- FrictionPattern
- EnergyPattern
- GrowthTrajectory

이 레이어는 “이 사람은 어떤 사람인가?”를 설명한다.

### Layer 2. Conversation Behavior Layer
이 문서에서 확장하는 핵심 층이다.
- question frequency
- directness
- disclosure speed
- empathy vs solution orientation
- abstraction vs concreteness
- conflict language style
- pacing / dominance / warmth

이 레이어는 “이 사람은 어떻게 말하고 반응하는가?”를 설명한다.

### Layer 3. Pair Simulation Layer
두 사람을 장면 기반으로 반복 시뮬레이션한다.
- first contact
- vulnerability
- pressure
- misunderstanding
- conflict
- repair
- re-selection
- longitudinal drift

이 레이어는 “둘이 실제로 만나면 어떤 동학이 생기는가?”를 설명한다.

### Layer 4. Network Layer
관계망 전체를 본다.
- homophily / structural similarity
- reciprocity
- transitivity / closure
- persistence / dissolution
- cluster dynamics

이 레이어는 “이 관계가 전체 관계장 안에서 어떤 의미를 갖는가?”를 설명한다.

---

## 5. Human Connection 입력 모델

각 사용자 `u`는 아래 네 가지 표현으로 요약된다.

### 5.1. 구조 온톨로지 벡터
\[
O_u = [V_u, B_u, G_u, E_u, D_u, F_u, N_u, T_u]
\]
- `V_u`: 가치관 벡터
- `B_u`: 신념 벡터
- `G_u`: 목표 방향 벡터
- `E_u`: 감정 패턴
- `D_u`: 의사결정 패턴
- `F_u`: 마찰 요인
- `N_u`: 에너지 패턴
- `T_u`: 성장 방향

### 5.2. 대화 행동 벡터
\[
C_u = [Q_u, Dir_u, Dis_u, Emp_u, Sol_u, Abs_u, Conf_u, Pace_u, Warm_u]
\]
- `Q_u`: 질문 빈도/유형
- `Dir_u`: 직설성
- `Dis_u`: 자기개방 속도
- `Emp_u`: 공감 중심성
- `Sol_u`: 해결 중심성
- `Abs_u`: 추상성
- `Conf_u`: 갈등 시 언어 패턴
- `Pace_u`: 대화 리듬
- `Warm_u`: 따뜻함/온기

### 5.3. 잠재 상태 벡터
현재 문맥에 따라 변하는 상태값.
\[
S_u(t) = [trust_t, openness_t, irritation_t, safety_t, curiosity_t, withdrawal_t, repair_t]
\]

### 5.4. 보조 prior 벡터 (선택)
MBTI function-stack-like hints, Enneagram hints 등은 노출하지 않고 내부 보조 prior로만 유지한다.
\[
P_u = [p_1, p_2, ..., p_k]
\]

이 벡터는 직접 매칭 점수에 강하게 쓰지 않고, 행동 추정의 약한 prior로만 사용한다.

---

## 6. 궁합/관계 적합성의 6축 모델
BELIFE는 단일 궁합 점수 대신 최소한 6축을 따로 계산한다.

### 6.1. 구조적 유사성
\[
S_{struct}(a,b) = w_v sim(V_a, V_b) + w_b sim(B_a, B_b) + w_g sim(G_a, G_b) + w_e sim(E_a, E_b) + w_d sim(D_a, D_b)
\]

의미:
- 가치관이 얼마나 비슷한가
- 세계를 해석하는 방식이 비슷한가
- 목표 방향이 정렬되는가
- 감정과 결정 패턴이 겹치는가

### 6.2. 보완성
보완성은 단순 반대가 아니라, 한 사람의 약한 영역을 다른 사람의 강점이 메우는지 본다.
\[
S_{comp}(a,b) = \sum_i w_i \cdot comp_i(a,b)
\]

예:
- 구조형 ↔ 실행형
- 정리형 ↔ 확장형
- 차분형 ↔ 활력형

### 6.3. 대화 적합성
\[
S_{dialogue}(a,b) = 1 - dist(C_a, C_b)
\]

단, 모든 차이가 나쁜 것은 아니다. 일부 차이는 상호보완적으로 작동하므로 다음과 같이 조정 가능하다.
\[
S_{dialogue}^*(a,b)=\alpha(1-dist(C_a,C_b)) + (1-\alpha) synergy(C_a,C_b)
\]

### 6.4. 갈등 적합성
\[
S_{conflict}(a,b)=1-Risk_{escalation}(a,b)
\]

`Risk_escalation`은 다음을 반영한다.
- 회피-직면 조합의 불균형
- 방어적 언어 증가
- 냉소/비난/해석 충돌
- 감정 상승 시 disengagement tendency

### 6.5. 회복/수리 적합성
\[
S_{repair}(a,b)=\frac{repair\_successes}{rupture\_episodes + \epsilon}
\]

또는 scene 기반 Monte Carlo 평균으로 계산한다.
\[
S_{repair}(a,b)=\frac{1}{n}\sum_{i=1}^{n} repair_i
\]

### 6.6. 정서적 안전감 (CDCS-inspired)
BELIFE는 CDCS 4요인을 제품용 축으로 번역해 아래처럼 사용한다.
\[
S_{safety}(a,b)=w_{sr}SR + w_{pr}PR + w_{pi}PI + w_{ae}AE
\]
- `SR`: Shared Reality
- `PR`: Partner Responsiveness
- `PI`: Participant Interest
- `AE`: Affective Experience

---

## 7. 최종 관계 적합성 점수
내부적으로는 다축 점수를 유지하고, 최종 종합 점수는 아래처럼 요약한다.

\[
Compatibility(a,b)=0.22S_{struct}+0.14S_{comp}+0.18S_{dialogue}+0.14S_{conflict}+0.14S_{repair}+0.18S_{safety}
\]

이는 기본형일 뿐이며, 관계 유형별로 가중치를 다르게 둘 수 있다.

### 관계 유형별 가중치 예시
- **friendship**: 구조적 유사성, 대화 적합성, 정서적 안전감 비중 ↑
- **collaboration**: 보완성, 갈등 적합성, 회복 가능성 비중 ↑
- **mentorship**: 보완성, responsiveness, growth alignment 비중 ↑
- **romantic_optional**: 대화 적합성, 정서적 안전감, persistence 비중 ↑

---

## 8. 신뢰도(Confidence) 모델
BELIFE는 점수 자체만큼 **이 점수가 얼마나 믿을 만한가**를 중요하게 봐야 한다.

### 8.1. 개인 신뢰도
\[
C_{person}(u)=0.30B_u+0.25H_u+0.25S_u+0.20L_u
\]
- `B_u`: 기본정보 완성도
- `H_u`: 유효 대화 축적도
- `S_u`: 구조 안정도
- `L_u`: 행동/맥락 연결도

### 8.2. 관계 신뢰도
\[
C_{pair}(a,b)=0.35\min(C_{person}(a),C_{person}(b))+0.25C_{dialogue\_obs}+0.25C_{sim}+0.15C_{network}
\]
- `C_dialogue_obs`: 실제 관측된 대화행동 신뢰도
- `C_sim`: 시뮬레이션 반복성과 분산 안정도
- `C_network`: 관계망 내 일관성/상호성 기반 신뢰도

### 8.3. 최종 보고 점수
\[
FinalScore(a,b)=Compatibility(a,b)\times C_{pair}(a,b)
\]

이렇게 하면 점수는 높지만 데이터가 빈약한 경우 과신하지 않게 된다.

---

## 9. 시뮬레이션 엔진 설계

### 9.1. 장면 기반 시뮬레이션
자유로운 장문 roleplay가 아니라, **짧고 구조화된 장면(scene)** 을 이어 붙인다.

필수 scene 클래스:
1. first contact
2. value conflict
3. pressure / uncertainty
4. collaboration
5. emotional vulnerability
6. misunderstanding
7. repair / reconciliation
8. competing options / reselection
9. longitudinal drift

### 9.2. 상태 전이
한 scene마다 상태를 업데이트한다.
\[
S_{t+1}=F(S_t, A_t, B_t, scene, \eta_t)
\]
- `S_t`: 현재 관계 상태
- `A_t`,`B_t`: 두 에이전트의 반응
- `scene`: 장면 조건
- `\eta_t`: 무작위 환경 변수

잠재 상태 예:
- trust
- openness
- irritation
- emotional safety
- reciprocity
- repair willingness
- disengagement risk
- commitment tendency

### 9.3. Monte Carlo 반복
BELIFE는 한 번의 시뮬레이션을 진실로 취급하지 않는다.
\[
Metric(a,b)=\frac{1}{n}\sum_{i=1}^{n} outcome_i(a,b,\theta_i)
\]
`\theta_i`는 환경 변수(피로도, 오해 강도, 시간 압박, 초기 trust 등)의 샘플이다.

### 9.4. 확장 가능한 반복 구조
전 사용자 전수 1000회는 금지한다. 대신:
- quick pass: 20 runs
- medium pass: 100 runs
- deep pass: 300~1000 runs (상위 후보쌍만)

---

## 10. 네트워크 레이어 설계

### 10.1. Hidden Graph
BELIFE는 pair score만 저장하지 않고 **숨은 연결 그래프**를 유지해야 한다.

각 edge는 다음 메타데이터를 가진다.
```json
{
  "pair": ["user_a", "user_b"],
  "compatibility": 0.81,
  "confidence": 0.67,
  "mode_scores": {
    "friendship": 0.86,
    "collaboration": 0.72,
    "mentorship": 0.63
  },
  "shared_reality": 0.79,
  "responsiveness": 0.74,
  "repair": 0.69,
  "last_simulated_at": "2026-07-01T12:00:00Z",
  "status": "latent"
}
```

### 10.2. ERGM/TERGM 논리의 적용
BELIFE는 full R implementation을 제품에 넣지 않더라도, 아래 메커니즘을 hidden graph 로직에 반영해야 한다.
- **homophily**: 유사한 구조는 edge 생성 확률 상승
- **reciprocity**: 양방향 관심/반응은 edge 안정성 상승
- **transitivity / closure**: 공통 연결이 많을수록 edge 강화 가능
- **persistence**: 오래 유지된 edge는 쉽게 사라지지 않음
- **dissolution**: 반응 부재, 불일치, low repair는 edge 약화

이를 BELIFE식으로 간단히 쓰면:
\[
EdgeStrength_{t+1}=\lambda E_t + \beta_1 Compatibility + \beta_2 Reciprocity + \beta_3 Closure - \beta_4 Drift - \beta_5 ConflictToxicity
\]

---

## 11. 메모리/온톨로지 시스템과의 연결

### 11.1. Mem0에서 차용할 점
Mem0는 2026 README에서 다음 특성을 강조한다.
- **Multi-Level Memory**: User, Session, Agent state
- **Single-pass ADD-only extraction**
- **Entity linking**
- **Multi-signal retrieval**
- **Temporal reasoning** [8]

BELIFE에서는 이를 이렇게 번역한다.
- `User Memory`: 개인 장기 구조
- `Session Memory`: 오늘/최근 대화 문맥
- `Agent Memory`: 디지털 트윈 상태
- ADD-only 원칙으로 raw memory는 유지
- entity linking으로 사람/가치/사건/관계 연결
- time-aware retrieval로 현재/과거/예정 상태 구분

### 11.2. Supermemory에서 차용할 점
Supermemory는 `memory`, `recall`, `context` 도구와 함께 `profile.static`, `profile.dynamic`, `searchResults`를 제공하고, “facts, preferences, project context — not noise”를 저장한다고 설명한다. [9]

BELIFE에서는 이를 다음처럼 차용한다.
- `profile.static` → Core ontology
- `profile.dynamic` → Active state / recent context
- `searchResults` → evidence retrieval
- `memory` → 사실/선호/관계 단서 저장
- `recall` → 관계 분석에 필요한 기억 재호출
- `context` → 시뮬레이션 전 사용자 상태 주입

### 11.3. BELIFE 고유 레이어
BELIFE는 Mem0/Supermemory 위에 다음 고유 구조가 필요하다.
- `EXTRACTED / INFERRED / AMBIGUOUS`
- `Core / Active / Archive`
- `L1 / L2 / L3 importance tier`
- `pairwise relationship memory`
- `simulation trace memory`

즉 BELIFE는 generic memory engine을 그대로 쓰는 게 아니라, **개인과 관계를 동시에 다루는 ontology-aware memory system**을 만들어야 한다.

---

## 12. 구현 모듈 제안
```text
human_connection/
├── compatibility_axes.py
├── ontology_similarity.py
├── complementarity_engine.py
├── conversation_behavior_match.py
├── conflict_fit.py
├── repair_fit.py
├── cdcs_mapper.py
├── pair_confidence.py
├── hidden_graph.py
├── graph_update_engine.py
├── candidate_filter.py
├── simulation/
│   ├── scene_library.py
│   ├── state_model.py
│   ├── step_runner.py
│   ├── monte_carlo.py
│   └── sim_aggregator.py
├── memory/
│   ├── pair_memory_store.py
│   ├── user_context_loader.py
│   └── evidence_retriever.py
└── reports/
    ├── relationship_summary.py
    └── scenario_report.py
```

---

## 13. 단계별 구현 순서

### Phase A. 점수 엔진 기초
- 구조적 유사성
- 보완성
- 대화 적합성
- CDCS-inspired 4축 매핑
- pair confidence

### Phase B. Hidden Graph
- candidate filtering
- hidden edge 생성
- edge strength update
- incremental reranking

### Phase C. 장면 기반 시뮬레이션
- first contact / disagreement / vulnerability / repair
- state transition
- Monte Carlo aggregation

### Phase D. 관계 분석 리포트
- 궁합도
- 관계 해석 신뢰도
- 축별 상세점수
- 상황별 시뮬레이션 요약

### Phase E. Belife World / Macro network
- cluster view
- 2D analytical + 3D world visualization 분리

---

## 14. 사용자에게 보여줄 출력 구조
사용자에게는 단순 “84점”이 아니라 다음처럼 보여준다.

### 종합
- 궁합도: 84 / 100
- 관계 해석 신뢰도: 높음

### 축별
- 구조적 유사성: 높음
- 보완성: 중간
- 대화 적합성: 높음
- 갈등 적합성: 보통
- 회복 가능성: 높음
- 정서적 안전감: 높음

### 상황별 요약
- **협업 상황**: 속도 차이로 초반 마찰 가능, 역할 분담 시 시너지 큼
- **감정적 취약성 상황**: 공감은 충분하나 해결 중심 반응이 먼저 나올 수 있음
- **갈등 상황**: 초반 어긋남은 있지만 회복 시도 확률이 높음

---

## 15. 중요한 설계 원칙
1. **유사성만 보지 않는다.**
2. **설명 가능한 점수를 유지한다.**
3. **관계의 질은 다축으로 본다.**
4. **한 번의 대화가 아니라 반복 시뮬레이션으로 본다.**
5. **전체 그래프는 pair score의 단순 합이 아니라 네트워크 구조를 가진다.**
6. **메모리는 단순 retrieval이 아니라 ontology-aware memory여야 한다.**
7. **MBTI/function stack/Enneagram은 보조 prior일 뿐 핵심 엔진이 아니다.**

---

## 16. 결론
BELIFE 휴먼커넥션 엔진은 단순 매칭 시스템이 아니다. 이 엔진은 개인 온톨로지, 대화 행위 모델, 장면 기반 시뮬레이션, 관계 질 척도, 숨은 네트워크 구조를 결합해 **“깊고 건강하며 유지 가능한 관계”**를 추정하는 시스템이어야 한다.

CDCS는 관계의 질을 분해하는 렌즈를 제공하고, ERGM/TERGM/btergm은 관계망 형성과 유지의 통계적 메커니즘을 설명하는 뼈대를 제공한다. Mem0와 Supermemory는 장기 기억과 맥락 주입을 위한 구조를 제공하고, BELIFE는 그 위에 ontology-aware memory와 relationship intelligence를 얹는다.

즉 BELIFE는 “좋아 보이는 사람을 추천하는 서비스”가 아니라, **왜 이 둘이 맞을 수 있고, 어디서 어긋날 수 있으며, 그 관계가 건강하게 유지될 가능성이 있는지까지 설명하는 관계 인텔리전스 시스템**으로 가야 한다.

---

## 참고문헌
[1] Okabe-Miyamoto, K., Walsh, L. C., Ozer, D. J., & Lyubomirsky, S. (2024). Measuring the experience of social connection within specific social interactions: The Connection During Conversations Scale (CDCS). *PLOS ONE*, 19(1), e0286408. https://doi.org/10.1371/journal.pone.0286408

[2] Montoya, R. M., Horton, R. S., & Kirchner, J. (2008). Is actual similarity necessary for attraction? A meta-analysis of actual and perceived similarity. *Journal of Social and Personal Relationships*, 25(6), 889–922.

[3] Karney, B. R., & Bradbury, T. N. (1995). The longitudinal course of marital quality and stability: A review of theory, methods, and research. *Psychological Bulletin*, 118(1), 3–34.

[4] Falconier, M. K., Jackson, J. B., Hilpert, P., & Bodenmann, G. (2015). Dyadic coping and relationship satisfaction: A meta-analysis. *Clinical Psychology Review*, 42, 28–46.

[5] `ergm` package documentation. CRAN / Statnet. https://search.r-project.org/CRAN/refmans/ergm/html/ergm-package.html

[6] `tergm` package documentation. CRAN / Statnet. https://search.r-project.org/CRAN/refmans/tergm/html/tergm-package.html

[7] `btergm` package documentation. CRAN. https://search.r-project.org/CRAN/refmans/btergm/html/btergm-package.html

[8] Mem0 README / documentation. https://github.com/mem0ai/mem0

[9] Supermemory README / documentation. https://github.com/supermemoryai/supermemory
