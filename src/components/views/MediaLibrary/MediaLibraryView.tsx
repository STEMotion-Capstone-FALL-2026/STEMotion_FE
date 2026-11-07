import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Code,
  Download,
  Search,
  Filter,
  Film,
  Calendar,
  User,
  Building,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { STEMScript, STEMSubject } from '../../../types/stem';
import { libraryService, LibraryItem, type LibraryQuery, type LibraryFilters } from '../../../services/libraryService';
import { StemLearningCard } from '../../stem/StemLearningCard';

interface MediaLibraryViewProps {
  script: STEMScript;
  onOpenPublishModal: () => void;
  showToast?: (message: string, type?: 'success' | 'info' | 'warn') => void;
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({
  script,
  onOpenPublishModal,
  showToast,
}) => {
  const [clips, setClips] = useState<LibraryItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<STEMSubject | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [advanced,setAdvanced] = useState(false);
  const [query,setQuery] = useState<LibraryQuery>({});
  const [facets,setFacets] = useState<LibraryFilters | null>(null);
  const [page,setPage] = useState(0);
  const [total,setTotal] = useState<number | null>(null);
  const [pages,setPages] = useState<number | null>(null);
  const facetRequest = useRef(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const requestId = useRef(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedClipEmbed, setSelectedClipEmbed] = useState<LibraryItem | null>(null);

  const fetchLibraryData = useCallback(async () => {
    const request = ++requestId.current;
    setLoading(true);
    setLoadError('');
    try {
      // The subject selector already contains the supported subjects; it needs no filters fetch.
      const clipList = await libraryService.getPublishedClips(selectedSubject, undefined, {...query, q:searchQuery, page, size:20});
      if (request !== requestId.current) return;
      setClips(clipList);
      setTotal(clipList.pagination?.total ?? null);setPages(clipList.pagination?.pages ?? null);
    } catch (err: any) {
      if (request !== requestId.current) return;
      setLoadError(err.message || 'Không tải được kho học liệu. Vui lòng thử lại.');
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [selectedSubject,query,searchQuery,page]);

  useEffect(() => {
    setClips([]);
    void fetchLibraryData();
    return () => { requestId.current++; };
  }, [fetchLibraryData]);

  const handleCopyEmbed = (clip: LibraryItem) => {
    const code = clip.embedCode || `<iframe src="${clip.videoUrl}" width="100%" height="450" frameborder="0" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(clip.id);
      showToast?.('Đã sao chép mã nhúng LMS vào bộ nhớ tạm!', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => showToast?.('Chưa sao chép được mã nhúng. Hãy mở mã nhúng và sao chép thủ công.', 'warn'));
  };

  const filteredClips = clips; // Server filters before paging and counts the same predicate.
  const changeFilter = (key: keyof LibraryQuery,value: string) => {setPage(0);setQuery(old=>({...old,[key]:value}));};
  const openFilters = async () => {
    setAdvanced(v=>!v);const request=++facetRequest.current;
    try {const value=await libraryService.getFilters({...query,q:searchQuery});if(request===facetRequest.current)setFacets(value);} catch(err:any){if(request===facetRequest.current)setLoadError(err.message || 'Không tải được bộ lọc.');}
  };

  const getSubjectColor = (subj: STEMSubject) => {
    switch (subj) {
      case 'Math': return 'from-blue-600 to-indigo-800 text-blue-200 border-blue-400';
      case 'Physics': return 'from-indigo-600 to-purple-800 text-indigo-200 border-indigo-400';
      case 'Chemistry': return 'from-emerald-600 to-teal-800 text-emerald-200 border-emerald-400';
      case 'Biology': return 'from-amber-600 to-orange-800 text-amber-200 border-amber-400';
      case 'ComputerScience': return 'from-cyan-600 to-blue-800 text-cyan-200 border-cyan-400';
      default: return 'from-slate-700 to-slate-900 text-slate-200 border-slate-400';
    }
  };

  return (
    <main className="flex-1 bg-slate-50 p-6 flex flex-col overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Header Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Film className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-extrabold text-slate-900">
                Thư Viện Clip STEM Học Liệu Số (Media Library)
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Học liệu đã xuất bản, kèm mục tiêu, nhiệm vụ học sinh và giới hạn sử dụng. Trạng thái xuất bản không phải xác nhận chuyên môn.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchLibraryData()}
              disabled={loading}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Tải lại danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>

            <button
              onClick={onOpenPublishModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Code className="w-4 h-4" />
              <span>Xuất Bản Bài Giảng Mới</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {setPage(0);setSearchQuery(e.target.value);}}
              placeholder="Tìm kiếm clip giải thích STEM theo tiêu đề, tác giả, bộ môn..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSubject}
              onChange={(e) => {setPage(0);setSelectedSubject(e.target.value as STEMSubject | '');}}
              aria-label="Lọc theo môn học"
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 font-medium text-slate-700"
            >
              <option value="">Tất cả môn STEM</option>
              <option value="Math">Toán học</option>
              <option value="Physics">Vật lý</option>
              <option value="Chemistry">Hóa học</option>
              <option value="Biology">Sinh học</option>
              <option value="ComputerScience">Tin học</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium ml-auto">
            Hiển thị: <b>{total ?? filteredClips.length}</b> video · Trang {page + 1}
          </div>
        </div>

        <button type="button" onClick={()=>void openFilters()} aria-expanded={advanced} className="text-sm underline">Bộ lọc STEM</button>
        {advanced && <div className="flex flex-wrap gap-3 bg-white rounded-xl p-4 border text-sm">
          <label>Cấp học<select aria-label="Cấp học" value={query.educationLevel || ''} onChange={e=>changeFilter('educationLevel',e.target.value)}><option value="">Tất cả</option>{(facets?.educationLevels || ['PRIMARY','LOWER_SECONDARY','UPPER_SECONDARY']).map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Lớp<input aria-label="Lọc theo lớp" value={query.grade || ''} maxLength={128} onChange={e=>changeFilter('grade',e.target.value)}/></label>
          <label>Môn trong hồ sơ<input aria-label="Môn trong hồ sơ" value={query.subjectId || ''} maxLength={128} onChange={e=>changeFilter('subjectId',e.target.value)}/></label>
          <label>Yêu cầu cần đạt<input aria-label="Yêu cầu cần đạt" value={query.outcomeId || ''} maxLength={128} onChange={e=>changeFilter('outcomeId',e.target.value)}/></label>
          <label>Bối cảnh<select aria-label="Bối cảnh học" value={query.usageContext || ''} onChange={e=>changeFilter('usageContext',e.target.value)}><option value="">Tất cả</option><option value="IN_CLASS_SCREEN">Chiếu trong lớp</option><option value="GROUP_PRACTICE">Thực hành nhóm</option></select></label>
          <label>Vai trò bối cảnh<select aria-label="Vai trò bối cảnh" value={query.contextRole || 'PRIMARY'} onChange={e=>changeFilter('contextRole',e.target.value)}><option value="PRIMARY">Chính</option><option value="SECONDARY">Phụ</option><option value="ANY">Bất kỳ</option></select></label>
          <label>Kênh<select aria-label="Kênh sử dụng" value={query.channel || ''} onChange={e=>changeFilter('channel',e.target.value)}><option value="">Tất cả</option><option value="DEPARTMENT_LIBRARY">Kho tổ chuyên môn</option></select></label>
          <label>Hồ sơ<select aria-label="Trạng thái hồ sơ" value={query.verificationStatus || ''} onChange={e=>changeFilter('verificationStatus',e.target.value)}><option value="">Tất cả</option><option value="LEGACY_UNMAPPED">Chưa đối chiếu</option><option value="UNVERIFIED">Chưa thẩm định</option></select></label>
        </div>}
        <nav aria-label="Phân trang thư viện" className="flex gap-4 text-sm"><button disabled={loading || page===0} onClick={()=>setPage(v=>v-1)}>Trang trước</button><button disabled={loading || (pages!=null ? page+1>=pages : clips.length<20)} onClick={()=>setPage(v=>v+1)}>Trang sau</button></nav>

        {/* Video Clips Grid */}
        {loadError && (
          <div role="alert" className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-900 space-y-2">
            <p>{loadError}</p>
            {clips.length > 0 && <p>Đang hiển thị dữ liệu đã tải trước đó.</p>}
            <button disabled={loading} onClick={() => void fetchLibraryData()} className="font-semibold underline disabled:opacity-50">Thử tải lại</button>
          </div>
        )}
        {loading && clips.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Đang tải kho học liệu số từ máy chủ...</p>
          </div>
        ) : filteredClips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClips.map((clip) => {
              const bgGradient = getSubjectColor(clip.subject);
              return (
                <div
                  key={clip.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  {/* Video Thumbnail Header */}
                  <div className={`aspect-video bg-gradient-to-br ${bgGradient} p-4 text-white flex flex-col justify-between relative`}>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-xs border border-white/20">
                        {clip.subject}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-200">
                        {clip.totalDurationSeconds || 60}s ({clip.sceneCount || 0} cảnh)
                      </span>
                    </div>

                    <div>
                      <h2 className="font-bold text-base leading-snug line-clamp-2 drop-shadow-xs">
                        {clip.title}
                      </h2>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-white/80 border-t border-white/10 pt-2 mt-2">
                      <span className="flex items-center gap-1 truncate">
                        <Building className="w-3 h-3 shrink-0" />
                        <span className="truncate">{clip.workspaceName || 'Không gian làm việc'}</span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <User className="w-3 h-3" />
                        <span>{clip.ownerName || 'Tác giả'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Body & Actions */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã xuất bản thư viện</span>
                      </span>
                      {clip.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(clip.publishedAt).toLocaleDateString('vi-VN')}</span>
                        </span>
                      )}
                    </div>

                    <StemLearningCard item={clip} />
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      {clip.videoUrl ? (
                        <a
                          href={clip.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-center flex items-center justify-center gap-1 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Mở / Tải MP4</span>
                        </a>
                      ) : (
                        <span className="flex-1 py-2 text-center text-slate-400 font-medium">Chưa có file</span>
                      )}

                      <button
                        onClick={() => handleCopyEmbed(clip)}
                        className={`py-2 px-3 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          copiedId === clip.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Sao chép mã nhúng iframe cho LMS"
                      >
                        {copiedId === clip.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === clip.id ? 'Đã chép' : 'Mã iFrame'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : loadError ? null : (
          /* Empty State */
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
              <Film className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h2 className="text-base font-bold text-slate-800">
                Chưa có video bài giảng nào trong Thư viện học liệu
              </h2>
              <p className="text-xs text-slate-500">
                {selectedSubject || searchQuery
                  ? 'Không tìm thấy video nào phù hợp với bộ lọc hiện tại. Thử xóa bộ lọc để xem tất cả.'
                  : 'Các bài giảng sau khi được Reviewer phê duyệt và xuất bản từ Producer Studio sẽ xuất hiện ở đây.'}
              </p>
            </div>
            {script.videoStatus === 'PUBLISHED' || script.videoStatus === 'APPROVED' ? (
              <button
                onClick={onOpenPublishModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Xuất Bản Bài Giảng Hiện Tại ({script.title})
              </button>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
};
