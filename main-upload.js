/* Main dashboard satellite upload bridge: imageInput -> deployed Render ML API. */
(() => {
  const API = 'https://ai-cyclone-prediction-api.onrender.com';
  const $ = (id) => document.getElementById(id);
  const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };

  function init() {
    const input = $('imageInput');
    if (!input || input.__mainUploadInstalled) return;
    input.__mainUploadInstalled = true;

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;

      set('fileName', file.name);
      set('uploadClass', 'Analysing…');
      set('uploadPattern', 'RUNNING');
      set('uploadWind', '—');
      set('uploadPressure', '—');
      set('uploadConfidence', '—');
      set('uploadRisk', '—');

      const form = new FormData();
      form.append('file', file);

      try {
        const response = await fetch(`${API}/api/ml/analyze-image`, {
          method: 'POST',
          body: form,
          cache: 'no-store'
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.detail || `HTTP ${response.status}`);

        const stage1 = result.stage1 || {};
        const stage3 = result.stage3 || {};
        const detected = Boolean(stage1.detected);

        set('uploadClass', result.classification || (detected ? 'CYCLONE DETECTED' : 'NO CYCLONE DETECTED'));
        set('uploadPattern', detected ? (result.classification || 'Cyclonic pattern') : 'No cyclone detected');
        set('uploadWind', stage3.wind_change_kt != null ? `${Number(stage3.wind_change_kt).toFixed(2)} kt Δ` : 'Not estimated');
        set('uploadPressure', stage3.mslp_change_hpa != null ? `${Number(stage3.mslp_change_hpa).toFixed(2)} hPa Δ` : 'Not estimated');
        set('uploadConfidence', result.confidence != null ? `${Number(result.confidence).toFixed(2)}%` : '—');
        set('uploadRisk', detected ? `${Number(stage1.probability || 0).toFixed(2)}% detection` : `${Number(stage1.probability || 0).toFixed(2)}% detection`);

        const message = result.message || 'AI analysis complete.';
        const badge = document.querySelector('#satellite .badge');
        if (badge) badge.textContent = result.model_status === 'MODEL_OUTPUT' ? 'AI MODEL OUTPUT' : result.model_status || 'AI ENDPOINT';

        window.dispatchEvent(new CustomEvent('ai-model-result', { detail: result }));
        console.log('[AI Cyclone] Render response:', result);
        set('modelForecastStatus', result.model_status === 'MODEL_OUTPUT' ? 'Real 3-stage model output received' : result.model_status || 'Backend response received');
        set('analysisClass', result.classification || 'Waiting');
        set('snapshotConfidence', result.confidence != null ? `${result.confidence}%` : '—');
        set('snapshotPattern', result.classification || '—');
        set('uploadClass', result.classification || 'Analysis complete');
        if (result.stage3?.next_position) {
          set('position', `${result.stage3.next_position.latitude.toFixed(4)}°, ${result.stage3.next_position.longitude.toFixed(4)}°`);
        }
        const notice = document.querySelector('#satellite .result .section-head h2');
        if (notice) notice.title = message;
      } catch (error) {
        console.error('[AI Cyclone] Upload/inference failed:', error);
        set('uploadClass', 'AI ERROR');
        set('uploadPattern', 'Backend unavailable');
        set('uploadWind', '—');
        set('uploadPressure', '—');
        set('uploadConfidence', '—');
        set('uploadRisk', '—');
        const badge = document.querySelector('#satellite .badge');
        if (badge) badge.textContent = 'ML ERROR';
        const notice = document.querySelector('#satellite .result .section-head h2');
        if (notice) notice.title = error.message;
        set('modelForecastStatus', `Error: ${error.message}`);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
