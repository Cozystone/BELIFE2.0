# BELIFE 멘탈 상태 분석 엔진 + 메모리/온톨로지 설계 문서 v2

## 핵심 추가점
이번 v2는 데이터 분석 관점의 학술 자료와 공식들을 보강했다.

### 추가한 분석 축
- State-space model
- Multimodal observation fusion
- EWMA trend
- Graph VAR / personal dynamics
- Burnout risk formula
- Cognitive distortion candidate formula
- Confidence / abstention formula
- Anomaly detection by baseline deviation

### memory / ontology 보강
- Mem0: user/session/agent memory, append-only, entity linking, temporal reasoning
- Supermemory: static/dynamic profile, hybrid search, contradiction handling, forgetting
- 최신 memory research: temporal reasoning, episodic recollection, conflict-aware memory

## 핵심 공식
```
x_t = A x_{t-1} + B u_t + w_t
y_t = H x_t + v_t
```
```
trend_t = lambda * score_t + (1-lambda) * trend_{t-1}
```
```
burnout_risk_t = sigmoid(b0 + b1*exhaustion + b2*meaning_loss + b3*low_control + b4*energy_drop + b5*context)
```
```
confidence = 0.30*profile_completeness + 0.25*valid_session_density + 0.20*ontology_stability + 0.15*behavior_feature_coverage + 0.10*contradiction_inverse
```

## 참고 링크
- Mem0: https://github.com/mem0ai/mem0
- Supermemory: https://github.com/supermemoryai/supermemory
- LLM in mental health review: https://arxiv.org/abs/2403.15401
- Burnout validation paper: https://arxiv.org/abs/2409.14357
- EMA forecasting with graphs: https://arxiv.org/abs/2403.19442
- Mixed-response SSM: https://arxiv.org/abs/2305.00207
- Ordinal state-space models: https://arxiv.org/abs/2305.13444
- Conversation science corpus: https://arxiv.org/abs/2203.00674
- KoACD: https://arxiv.org/abs/2505.00367
- CDCS: https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0286408
```