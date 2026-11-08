import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { encounterTypes } from '@encounter/shared';
import { Icon } from '../components/Icon';
import { mockPatients, useSession } from '../session';
import './setup.css';

/**
 * Step 1 of the flow: who the patient is and what kind of visit this is.
 * The encounter type decides the checklist shown during the visit.
 */
export function SetupPage() {
  const navigate = useNavigate();
  const { start } = useSession();
  const [patientId, setPatientId] = useState(mockPatients[0].id);
  const [typeId, setTypeId] = useState(encounterTypes[0].id);
  const [consented, setConsented] = useState(false);

  const type = encounterTypes.find((t) => t.id === typeId)!;
  const requiredCount = type.items.filter((i) => i.priority === 'required').length;
  const payerCount = type.items.filter((i) => i.payerCritical).length;

  function handleStart() {
    start({ patient: mockPatients.find((p) => p.id === patientId)!, encounterTypeId: typeId });
    navigate('/live');
  }

  return (
    <main className="setup">
      <header className="setup-header">
        <div>
          <p className="eyebrow">New encounter</p>
          <h1>Set up the visit</h1>
        </div>
        <div className="clinician">
          <span className="avatar" aria-hidden="true">ES</span>
          <span>E. Sandberg, CPO</span>
        </div>
      </header>

      <div className="setup-grid">
        <div className="setup-choices">
          <fieldset>
            <legend>Patient</legend>
            <div className="patient-list">
              {mockPatients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="option"
                  aria-pressed={p.id === patientId}
                  onClick={() => setPatientId(p.id)}
                >
                  <span className="option-title">{p.name} · {p.age}</span>
                  <span className="option-detail">{p.detail}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Encounter type</legend>
            <div className="type-grid">
              {encounterTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="option option-type"
                  aria-pressed={t.id === typeId}
                  onClick={() => setTypeId(t.id)}
                >
                  <span className="option-title">{t.name}</span>
                  <span className="option-detail">{t.summary}</span>
                  <span className="option-detail option-time">~{t.typicalMinutes} min</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <section className="capture" aria-labelledby="capture-heading">
          <div>
            <h2 id="capture-heading">What we’ll help you capture</h2>
            <p className="capture-summary">
              {requiredCount} required items; the {payerCount} checked by payers are locked. Everything ticks
              off on its own as the conversation covers it.
            </p>
          </div>

          <ul className="capture-list">
            {type.items.map((item) => (
              <li key={item.id}>
                <span>{item.label}</span>
                {item.payerCritical && (
                  <span className="tag tag-payer" title="Commonly required by payers, so it can’t be removed">
                    <Icon name="lock" size={11} strokeWidth={2.5} />
                    Payer
                  </span>
                )}
                {item.priority === 'recommended' && <span className="tag">Optional</span>}
              </li>
            ))}
          </ul>

          <div className="capture-footer">
            <label className="consent">
              <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} />
              Patient has agreed to the visit being recorded
            </label>
            <button type="button" className="btn btn-primary btn-large" disabled={!consented} onClick={handleStart}>
              <Icon name="mic" size={20} />
              Start recording
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
