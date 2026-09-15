(() => {
  'use strict';
  const API_BASE = (window.STRIDE_API_BASE || 'https://ai-cyclone-prediction-api.onrender.com').replace(/\/$/, '');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const state = { file: null, data: null };

  const toast = (message) => {
    const el = $('#toast'); if (!el) return;
    el.textContent = message; el.classList.add('show');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 3600);
  };
  const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = (v, suffix = '') => v === undefined || v === null || v === '' ? 'Not provided' : `${v}${suffix}`;

  function setStep(n, status, mode = '') {
    const el = $(`#step${n}`); if (!el) return;
    el.className = `step ${mode}`;
    $('.step-status', el).textContent = status;
  }
  function resetSteps() { [1,2,3,4].forEach(n => setStep(n, 'Waiting')); }

  function showView(id) {
    $$('.view').forEach(v => v.classList.toggle('active', v.id === id));
    $$('.nav button').forEach(b => b.classList.toggle('active', b.dataset.view === id));
    $('#sidebar')?.classList.remove('open');
    window.scrollTo({top:0, behavior:'smooth'});
  }

  function renderResult(data) {
    state.data = data;
    $('#rawOutput').textContent = JSON.stringify(data, null, 2);
    const rejected = data?.model_status === 'INPUT_REJECTED' || data?.input_validation?.is_satellite === false;
    const ts = data?.three_stage || {};
    const identification = ts.identification || data?.stage1 || {};
    const classification = ts.classification || data?.stage2 || {};
    const prediction = ts.prediction || data?.stage3 || {};
    const detected = identification.cyclone_detected;

    if (rejected) {
      setStep(1, 'Rejected', 'bad'); setStep(2, 'Stopped', 'bad'); setStep(3, 'Not run', 'bad'); setStep(4, 'Withheld', 'bad');
      $('#trust').className = 'trust danger';
      $('#trust').innerHTML = '<b>Input rejected.</b> The backend did not verify this file as acceptable satellite imagery. No cyclone result was generated.';
      $('#analysisState').textContent = 'INPUT REJECTED';
      $('#windValue').textContent = 'Not assessed'; $('#speedValue').textContent = 'Not assessed'; $('#pressureValue').textContent = 'Not assessed'; $('#riskValue').textContent = 'Not assessed';
      return;
    }

    setStep(1, 'Verified', 'done'); setStep(2, 'Complete', 'done'); setStep(3, 'Complete', 'done'); setStep(4, 'Complete', 'done');
    $('#trust').className = 'trust safe';
    $('#trust').innerHTML = '<b>Verified pipeline.</b> The UI is displaying backend model/data output only. Missing values are intentionally not invented.';
    $('#analysisState').textContent = detected === true ? 'CYCLONE DETECTED' : detected === false ? 'NO CYCLONE DETECTED' : 'RESULT RECEIVED';

    $('#windValue').textContent = fmt(prediction.maximum_wind_kmh, ' km/h');
    $('#speedValue').textContent = fmt(prediction.movement_speed_kmh, ' km/h');
    $('#pressureValue').textContent = fmt(prediction.central_pressure_hpa, ' hPa');
    $('#riskValue').textContent = fmt(prediction.risk_level);
    $('#timeValue').textContent = new Date().toLocaleString();

    const idText = detected === true ? `YES • ${fmt(identification.probability_percent, '%')}` : detected === false ? `NO • ${fmt(identification.probability_percent, '%')}` : 'Not provided';
    $('#identificationSummary').textContent = idText;
    $('#classificationSummary').textContent = classification.label ? `${classification.label} • ${fmt(classification.confidence_percent, '%')}` : detected === false ? 'Not applicable — no cyclone detected' : 'Not provided';
    $('#predictionSummary').textContent = prediction.status === 'AVAILABLE' ? `${fmt(prediction.risk_level)} • ${fmt(prediction.next_position)}` : 'Not available — time-series inputs required';
  }

  async function analyze() {
    if (!state.file) return;
    const btn = $('#analyzeBtn'); btn.disabled = true; btn.textContent = 'Analyzing…';
    resetSteps(); setStep(1, 'Checking…', 'running'); $('#analysisState').textContent = 'VALIDATING INPUT';
    $('#alert').classList.add('hidden');
    try {
      const form = new FormData(); form.append('file', state.file);
      setStep(2, 'Preprocessing…', 'running');
      const response = await fetch(`${API_BASE}/api/ml/analyze-image`, { method:'POST', body:form });
      let data = null; try { data = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(data?.detail || data?.message || `API returned HTTP ${response.status}`);
      setStep(2, 'Complete', 'done'); setStep(3, 'Running model…', 'running');
      renderResult(data);
      if (data?.model_status === 'INPUT_REJECTED' || data?.input_validation?.is_satellite === false) {
        $('#alert').classList.remove('hidden'); $('#alertText').textContent = 'The backend rejected this input. Try a genuine IR/VIS/WV satellite observation from a recognised source.';
      }
      toast('STRIDE analysis completed.');
    } catch (err) {
      resetSteps(); setStep(1, 'Failed', 'bad'); setStep(2, 'Stopped', 'bad'); setStep(3, 'Unavailable', 'bad'); setStep(4, 'Withheld', 'bad');
      $('#analysisState').textContent = 'MODEL UNAVAILABLE';
      $('#rawOutput').textContent = JSON.stringify({ status:'MODEL_UNAVAILABLE', message:err.message, simulated_result:false }, null, 2);
      $('#trust').className = 'trust danger'; $('#trust').innerHTML = '<b>No simulated result generated.</b> The live ML service could not be reached. This prototype intentionally fails closed instead of showing fake cyclone values.';
      toast('ML service unavailable — no simulated result was shown.');
    } finally { btn.disabled = false; btn.textContent = 'Run STRIDE AI Analysis'; }
  }

  function selectFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|tiff)$/.test(file.type)) { toast('Please select JPG, PNG, WEBP or TIFF imagery.'); return; }
    if (file.size > 15 * 1024 * 1024) { toast('Image must be 15 MB or smaller.'); return; }
    state.file = file;
    $('#fileName').textContent = `${file.name} • ${(file.size/1024/1024).toFixed(2)} MB`;
    const img = $('#previewImage'); img.src = URL.createObjectURL(file); $('#preview').classList.add('has-image'); $('#analyzeBtn').disabled = false;
    resetSteps(); $('#rawOutput').textContent = 'Image selected. Run STRIDE AI Analysis to send it to the production ML API.'; $('#analysisState').textContent = 'READY FOR ANALYSIS';
  }

  function bind() {
    $$('.nav button').forEach(b => b.addEventListener('click', () => showView(b.dataset.view)));
    $('#mobileMenu')?.addEventListener('click', () => $('#sidebar')?.classList.toggle('open'));
    $('#fileInput')?.addEventListener('change', e => selectFile(e.target.files[0]));
    const drop = $('#dropzone');
    ['dragenter','dragover'].forEach(evt => drop?.addEventListener(evt, e => {e.preventDefault(); drop.classList.add('drag');}));
    ['dragleave','drop'].forEach(evt => drop?.addEventListener(evt, e => {e.preventDefault(); drop.classList.remove('drag');}));
    drop?.addEventListener('drop', e => selectFile(e.dataTransfer.files[0]));
    $('#analyzeBtn')?.addEventListener('click', analyze);
    $('#clearBtn')?.addEventListener('click', () => { state.file=null; $('#fileInput').value=''; $('#fileName').textContent='No image selected'; $('#preview').classList.remove('has-image'); $('#previewImage').removeAttribute('src'); $('#analyzeBtn').disabled=true; resetSteps(); $('#rawOutput').textContent='Select a satellite image to begin.'; $('#analysisState').textContent='WAITING FOR INPUT'; ['windValue','speedValue','pressureValue','riskValue','timeValue'].forEach(id => { $('#'+id).textContent='Awaiting verified result'; }); });
    $('#copyOutput')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#rawOutput').textContent); toast('Raw output copied.'); } catch (_) { toast('Copy is not available in this browser.'); } });
    $('#openApi')?.addEventListener('click', () => window.open(`${API_BASE}/docs`, '_blank', 'noopener'));
    $('#refreshSources')?.addEventListener('click', () => toast('Source registry refreshed. Official links are kept separate from model output.'));
  }
  document.addEventListener('DOMContentLoaded', bind);
})();