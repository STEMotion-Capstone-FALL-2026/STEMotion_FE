import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  StemViewResponse,
  StemAssessment,
  StemCriterion,
  StemChangeTarget,
  StemEvidence,
} from '../../types/stem';
import { scriptService } from '../../services/scriptService';
import { stemMutationKey } from '../../services/stemClient';
import { StemErrorNotice } from './StemErrorNotice';
import { useDialog } from '../../hooks/useDialog';

export interface StemRubricPanelProps {
  isOpen: boolean;
  onClose: () => void;
  scriptId: string;
  versionId: string;
  scriptRevision: number;
  phase?: 'SCRIPT'|'VIDEO';
  compositionRevision?: number;
  isReviewerActive: boolean;
  userRole?: string;
  assessment: StemAssessment | null;
  onAssessmentChange: (assessment: StemAssessment) => void;
  onRequestChangesWithTarget?: (changeTarget: StemChangeTarget, note: string) => Promise<void | boolean>;
  onApproveWithAssessment?: () => Promise<void | boolean>;
  decisionPending?: boolean;
}

export const DEFAULT_CRITERIA_KEYS = [
  {
    key: 'CRIT_SCIENCE_INQUIRY',
    label: 'Science (Khoa học): Khám phá & Bản chất hiện tượng',
    description: 'Nội dung có làm rõ câu hỏi khoa học, dữ kiện thực nghiệm hoặc hiện tượng tự nhiên không?',
  },
  {
    key: 'CRIT_TECH_APPLICATION',
    label: 'Technology (Công nghệ): Ứng dụng & Công cụ số',
    description: 'Có sử dụng công cụ mô phỏng số, đo đạc hoặc thiết bị công nghệ hỗ trợ bài học không?',
  },
  {
    key: 'CRIT_ENG_DESIGN',
    label: 'Engineering (Kỹ thuật): Quy trình thiết kế & Giải pháp',
    description: 'Học sinh có được tiếp cận bước thiết kế, thử nghiệm, tối ưu hóa giải pháp kỹ thuật không?',
  },
  {
    key: 'CRIT_MATH_REASONING',
    label: 'Mathematics (Toán học): Mô hình hóa & Tính toán định lượng',
    description: 'Có áp dụng công thức, đồ thị, ước lượng dữ liệu hoặc phân tích định lượng không?',
  },
  {
    key: 'CRIT_INTERDISCIPLINARY',
    label: 'Tích hợp liên môn & Bối cảnh thực tiễn',
    description: 'Sự kết hợp giữa các lĩnh vực có tự nhiên, gắn với bối cảnh lớp học/thực tiễn đã khai báo không?',
  },
  {
    key: 'CRIT_PEDAGOGY',
    label: 'Tính sư phạm, Chuẩn đầu ra & Nhiệm vụ học sinh',
    description: 'Mục tiêu học tập rõ ràng, nhiệm vụ học sinh khả thi và đo lường được.',
  },
];

export const JUDGMENT_LABELS: Record<StemCriterion['judgment'], { label: string; badge: string }> = {
  ADEQUATE: {
    label: 'Đạt yêu cầu (Adequate)',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  NEEDS_CHANGES: {
    label: 'Cần chỉnh sửa (Needs Changes)',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  NOT_ASSESSED: {
    label: 'Chưa đánh giá (Not Assessed)',
    badge: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  NOT_APPLICABLE: {
    label: 'Không áp dụng (N/A)',
    badge: 'bg-slate-100 text-slate-500 border-slate-200',
  },
};

export const StemRubricPanel: React.FC<StemRubricPanelProps> = ({
  isOpen,
  onClose,
  scriptId,
  versionId,
  scriptRevision,
  phase='SCRIPT',
  compositionRevision,
  isReviewerActive,
  userRole,
  assessment,
  onAssessmentChange,
  onRequestChangesWithTarget,
  onApproveWithAssessment,
  decisionPending = false,
}) => {
  const [activeTab, setActiveTab] = useState<'RUBRIC' | 'BRIEF_VIEW'>('RUBRIC');
  const [stemData, setStemData] = useState<StemViewResponse | null>(null);
  const [rubricCatalog, setRubricCatalog] = useState<import('../../types/stem').CatalogVersionEntry[]>([]);
  const [loadingStem, setLoadingStem] = useState(false);
  const [stemError, setStemError] = useState<string | null>(null);

  // Target change state for request-changes
  const [changeTargetNote, setChangeTargetNote] = useState('');
  const [showTargetModal, setShowTargetModal] = useState(false);

  const [apiError,setApiError]=useState<unknown>(null);
  const [reload,setReload]=useState(0);
  const callback=useRef(onAssessmentChange);callback.current=onAssessmentChange;
  const assessmentRef=useRef(assessment);assessmentRef.current=assessment;
  const requestKey=useRef<{payload:string;key:string}|null>(null);
  const targetDialog=useDialog(showTargetModal,'Chỉ định đích sửa đổi',()=>setShowTargetModal(false),decisionPending);
  useEffect(()=>{
    if(!isOpen||!scriptId||!versionId)return;
    let current=true;setLoadingStem(true);setApiError(null);setStemError(null);setStemData(null);
    scriptService.getStemBrief(scriptId,versionId).then(async data=>{
      if(!current)return;setStemData(data);setLoadingStem(false);
      let rubrics: import('../../types/stem').CatalogVersionEntry[] = [];
      try { rubrics = await scriptService.getCatalog('RUBRIC', 0, 50); } catch { /* ignore */ }
      if(!current)return;
      setRubricCatalog(rubrics);
      const defaultRubricId = data.brief?.policyVersionId ?
        (rubrics.find(r => r.id === data.brief?.policyVersionId || r.parentId === data.brief?.policyVersionId)?.id ?? rubrics[0]?.id ?? null)
        : (rubrics[0]?.id ?? null);
      const currentFp = phase === 'VIDEO' ? (data.compositionFingerprint ?? null) : (data.scriptFingerprint ?? null);
      const existingCriteria = assessmentRef.current?.criteria;
      const initialCriteria = (existingCriteria && existingCriteria.length > 0)
        ? existingCriteria
        : DEFAULT_CRITERIA_KEYS.map(c=>({key:c.key,judgment:'NOT_ASSESSED',rationale:'',evidenceIds:[]}));
      const chosenRubricId = assessmentRef.current?.rubricVersionId ?? defaultRubricId;
      if(isReviewerActive)callback.current({
        expectedBriefRevision:data.revision,
        expectedScriptRevision:scriptRevision,
        expectedModeRevision:data.modeRevision,
        expectedCompositionRevision:phase==='VIDEO'?compositionRevision:null,
        rubricVersionId:chosenRubricId,
        expectedFingerprint:currentFp,
        criteria:initialCriteria,
        idempotencyKey:stemMutationKey()
      });
    }).catch(err=>{if(current){setApiError(err);setStemError(err.message);setLoadingStem(false);}});
    return()=>{current=false;};
  },[isOpen,scriptId,versionId,scriptRevision,phase,compositionRevision,isReviewerActive,reload]);

  const updateCriterion=(key:string,patch:Partial<StemCriterion>)=>{
    if(!isReviewerActive||!assessment||!stemData||apiError)return;
    onAssessmentChange({...assessment,criteria:assessment.criteria.map(c=>c.key===key?{...c,...patch}:c),idempotencyKey:stemMutationKey()});
  };
  const handleJudgmentChange=(key:string,judgment:StemCriterion['judgment'])=>updateCriterion(key,{judgment});
  const handleRationaleChange=(key:string,rationale:string)=>updateCriterion(key,{rationale});
  const handleTriggerChangeRequest=async()=>{
    if(!onRequestChangesWithTarget||!isReviewerActive||!stemData||!changeTargetNote.trim())return;
    const target={expectedVersionId:versionId,expectedScriptRevision:scriptRevision,expectedBriefRevision:stemData.revision};
    const payload=JSON.stringify([target,changeTargetNote.trim()]);
    if(requestKey.current?.payload!==payload)requestKey.current={payload,key:stemMutationKey()};
    try{const success=await onRequestChangesWithTarget({...target,idempotencyKey:requestKey.current.key},changeTargetNote.trim());if(success!==false)setShowTargetModal(false);}
    catch(err){setApiError(err);}
  };

  if (!isOpen) return null;

  const brief = stemData?.brief;
  const evidenceList = stemData?.evidence || [];

  return (
    <aside
      className="fixed inset-y-0 right-0 w-96 max-w-full bg-white shadow-2xl border-l border-slate-200 z-40 flex flex-col transition-transform duration-200 ease-in-out text-xs"
      aria-label="STEM Rubric QA Drawer"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-400" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100">Rubric Thẩm Định STEM</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                DRAFT / UNVERIFIED
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Đề xuất UI DRAFT; chưa phải rubric P2 đã khóa/chuyên môn đã thẩm định</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Đóng bảng thẩm định"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Ranh giới phân quyền / Check ghế REVIEWER active (P4-Q04) */}
      {!isReviewerActive && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-rose-900 flex items-start gap-2 shrink-0">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-[11px]">Chặn Bypass Quản Trị Viên (Admin)</span>
            <p className="text-[10px] text-rose-700 leading-tight">
              Tài khoản hiện tại ({userRole || 'Không xác định'}) chưa kích hoạt ghế <b>REVIEWER</b> hợp lệ trong workspace. Form chấm điểm bị khóa chỉ đọc nhằm đảm bảo tính trung thực chuyên môn.
            </p>
          </div>
        </div>
      )}

      <StemErrorNotice error={apiError} onReload={()=>setReload(n=>n+1)} />
      {loadingStem&&<p role="status">Đang tải hồ sơ STEM…</p>}
      {rubricCatalog.length > 0 && (
        <div className="px-4 py-1.5 bg-slate-800 text-white flex items-center justify-between text-[10px]">
          <span>Phiên bản Rubric:</span>
          <select
            aria-label="Chọn Rubric"
            value={assessment?.rubricVersionId ?? ''}
            disabled={!isReviewerActive}
            onChange={e => {
              if (assessment) onAssessmentChange({ ...assessment, rubricVersionId: e.target.value || null, idempotencyKey: stemMutationKey() });
            }}
            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-200"
          >
            <option value="">Chưa chọn rubric</option>
            {rubricCatalog.map(r => (
              <option key={r.id} value={r.id}>{r.logicalKey} v{r.version}</option>
            ))}
          </select>
        </div>
      )}
      <div className="px-4 py-1 bg-slate-100 text-[10px] text-slate-600 flex items-center justify-between border-b">
        <span>{phase === 'VIDEO' ? 'Composition Fingerprint:' : 'Script Fingerprint:'}</span>
        <code className="font-mono text-[9px] bg-slate-200 px-1 rounded text-slate-800">
          {assessment?.expectedFingerprint ? `${assessment.expectedFingerprint.slice(0, 12)}...` : 'Chờ server cấp'}
        </code>
      </div>
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 text-slate-600 font-semibold text-[11px]">
        <button
          onClick={() => setActiveTab('RUBRIC')}
          className={`flex-1 py-2 text-center border-b-2 ${
            activeTab === 'RUBRIC'
              ? 'border-brand-600 text-brand-700 bg-white font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Tiêu Chí Rubric (6)
        </button>
        <button
          onClick={() => setActiveTab('BRIEF_VIEW')}
          className={`flex-1 py-2 text-center border-b-2 ${
            activeTab === 'BRIEF_VIEW'
              ? 'border-brand-600 text-brand-700 bg-white font-bold'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          Hồ Sơ Tác Giả Đã Khai
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {activeTab === 'RUBRIC' ? (
          <>
            {/* Criteria Evaluation List */}
            <div className="space-y-3.5">
              {DEFAULT_CRITERIA_KEYS.map((crit, idx) => {
                const current = assessment?.criteria?.find((c) => c.key === crit.key);
                const currentJudgment = current?.judgment || 'NOT_ASSESSED';
                const currentRationale = current?.rationale || '';

                return (
                  <div
                    key={crit.key}
                    className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">#{idx + 1}</span>
                        <h4 className="font-bold text-slate-800 text-[11px] leading-snug">{crit.label}</h4>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${JUDGMENT_LABELS[currentJudgment].badge}`}
                      >
                        {JUDGMENT_LABELS[currentJudgment].label.split(' ')[0]}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-tight">{crit.description}</p>

                    {/* Radio Options */}
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      {(['ADEQUATE', 'NEEDS_CHANGES', 'NOT_ASSESSED', 'NOT_APPLICABLE'] as StemCriterion['judgment'][]).map(
                        (judgmentOption) => (
                          <label
                            key={judgmentOption}
                            className={`flex items-center gap-1.5 p-1 rounded border text-[10px] cursor-pointer transition-colors ${
                              currentJudgment === judgmentOption
                                ? 'bg-brand-50 border-brand-300 font-semibold text-brand-900 shadow-2xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            } ${!isReviewerActive ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="radio"
                              name={`judgment_${crit.key}`}
                              value={judgmentOption}
                              checked={currentJudgment === judgmentOption}
                              disabled={!isReviewerActive || loadingStem || Boolean(apiError) || !stemData || decisionPending}
                              onChange={() => handleJudgmentChange(crit.key, judgmentOption)}
                              className="text-brand-600 focus:ring-brand-500 w-3 h-3"
                            />
                            <span className="truncate">{JUDGMENT_LABELS[judgmentOption].label.split(' ')[0]}</span>
                          </label>
                        )
                      )}
                    </div>

                    <fieldset disabled={!isReviewerActive || !stemData || Boolean(apiError) || decisionPending}><legend>Minh chứng tham chiếu</legend>
                      {evidenceList.filter(e=>e.id).map(e=><label key={e.id} className="block"><input type="checkbox" checked={current?.evidenceIds.includes(e.id!)??false} onChange={event=>updateCriterion(crit.key,{evidenceIds:event.target.checked?[...(current?.evidenceIds??[]),e.id!]:current?.evidenceIds.filter(id=>id!==e.id)??[]})}/>[{e.component}] {e.sceneId??e.taskKey}: {e.explanation}</label>)}
                    </fieldset>
                    {/* Rationale input */}
                    <div className="pt-1">
                      <input
                        type="text"
                        maxLength={4000} aria-label={`Lý do ${crit.key}`} placeholder="Nhận xét / lý do đánh giá tiêu chí này..."
                        value={currentRationale}
                        disabled={!isReviewerActive || loadingStem || Boolean(apiError) || !stemData || decisionPending}
                        onChange={(e) => handleRationaleChange(crit.key, e.target.value)}
                        className="w-full text-[10px] px-2 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-brand-500 focus:border-brand-500 disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Brief View tab: Reference what the writer specified */
          <div className="space-y-3">
            {loadingStem ? (
              <p className="text-slate-500 italic text-center py-4">Đang tải hồ sơ STEM của tác giả...</p>
            ) : stemError ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 inline mr-1" />
                {stemError}
              </div>
            ) : !brief ? (
              <p className="text-slate-400 italic text-center py-4">Chưa có hồ sơ STEM được khai báo cho kịch bản này.</p>
            ) : (
              <div className="space-y-3 text-[11px]">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-800 block mb-1">Mục tiêu & Bối cảnh</span>
                  <p className="text-slate-600">
                    <b>Bối cảnh chính:</b> {brief.context?.primary?.key || 'Chưa chọn'}
                  </p>
                  <p className="text-slate-600">
                    <b>Kênh triển khai:</b> {brief.distributionChannels?.join(', ') || 'Chưa chọn'}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <span className="font-bold text-slate-800 block">Đóng góp S - T - E - M</span>
                  <div className="space-y-1 text-slate-700">
                    {brief.contributions?.map((c) => (
                      <div key={c.component}>
                        <b>{c.component}:</b> {c.explanation || '—'}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-800 block mb-1">
                    Minh chứng phân cảnh ({evidenceList.length})
                  </span>
                  {evidenceList.length > 0 ? (
                    <ul className="space-y-1">
                      {evidenceList.map((ev, i) => (
                        <li key={i} className="text-slate-600 border-b border-slate-200/60 pb-1">
                          <span className="font-bold text-brand-700">[{ev.component}]</span> Cảnh {ev.sceneId}: {ev.explanation}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-slate-400 italic">Chưa liên kết phân cảnh nào.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2 shadow-2xs">
        {onApproveWithAssessment&&isReviewerActive&&<button disabled={decisionPending||loadingStem||Boolean(apiError)||!assessment||assessment.criteria.some(c=>!c.rationale.trim())||(phase==='VIDEO'&&compositionRevision===undefined)} onClick={()=>void onApproveWithAssessment()}>Duyệt kèm assessment</button>}
        <p>Mọi mức đánh giá cần lý do. BE kiểm tra ghế và CAS trong cùng request duyệt.</p>
        {/* Change Target Trigger Button (P4-Q04) */}
        {onRequestChangesWithTarget && isReviewerActive && (
          <button
            onClick={() => setShowTargetModal(true)}
            disabled={decisionPending || !stemData || Boolean(apiError)}
            className="w-full py-1.5 px-3 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>Yêu cầu sửa đổi kèm đích (Change Target)</span>
          </button>
        )}
      </div>

      {/* Modal chọn đích sửa đổi (Change Target Modal) */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div ref={targetDialog} className="bg-white rounded-xl max-w-md w-full p-4 space-y-3 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Chỉ định đích sửa đổi (STEM Change Target)
              </h3>
              <button onClick={() => setShowTargetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-snug">
              Xác định phạm vi tác giả cần chỉnh sửa kèm mã idempotencyKey phiên làm việc:
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                Lý do yêu cầu sửa đổi (sẽ gửi cho Tác giả):
              </label>
              <textarea
                rows={3}
                maxLength={4000} value={changeTargetNote}
                onChange={(e) => setChangeTargetNote(e.target.value)}
                placeholder="Ghi rõ nội dung tác giả cần chỉnh sửa trong kịch bản hoặc hồ sơ STEM..."
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowTargetModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-600"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={decisionPending || !stemData || Boolean(apiError)}
                onClick={handleTriggerChangeRequest}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs transition-colors"
              >
                {decisionPending ? 'Đang gửi…' : 'Xác nhận yêu cầu sửa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
