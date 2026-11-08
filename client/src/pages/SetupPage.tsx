import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildChecklist, createCustomItem, encounterTypes, type RequiredItem } from '@encounter/shared';
import { ChecklistEditor } from '../components/ChecklistEditor';
import { Icon } from '../components/Icon';
import { mockPatients, useSession } from '../session';
import './setup.css';

/**
 * Step 1 of the flow: who the patient is and what kind of visit this is.
 * The encounter type decides the checklist shown during the visit.
 */
export function SetupPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { start } = useSession();
  const [patientId, setPatientId] = useState(mockPatients[0].id);
  const [typeId, setTypeId] = useState(encounterTypes[0].id);
  const [consented, setConsented] = useState(false);
  // Per-visit changes to the checklist. Hidden ids only match optional items,
  // and added items stay when switching encounter type (they're about the patient).
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());
  const [customItems, setCustomItems] = useState<RequiredItem[]>([]);
  const nextCustomId = useRef(1);

  const type = encounterTypes.find((t) => t.id === typeId)!;
  const checklist = buildChecklist(type, hiddenIds, customItems);
  const requiredCount = checklist.filter((i) => i.priority === 'required').length;
  const payerCount = checklist.filter((i) => i.payerCritical).length;

  function setHidden(id: string, hide: boolean) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (hide) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleStart() {
    start({ patient: mockPatients.find((p) => p.id === patientId)!, encounterTypeId: typeId, checklist });
    // Keep demo options like ?speed= and ?fail= across screens.
    navigate(`/live${search}`);
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

          <ChecklistEditor
            templateItems={type.items}
            hiddenIds={hiddenIds}
            customItems={customItems}
            onHide={(item) => setHidden(item.id, true)}
            onRestore={(item) => setHidden(item.id, false)}
            onAdd={(label) => setCustomItems((prev) => [...prev, createCustomItem(label, `custom-${nextCustomId.current++}`)])}
            onRemove={(item) => setCustomItems((prev) => prev.filter((i) => i.id !== item.id))}
          />

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
