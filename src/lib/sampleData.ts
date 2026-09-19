import { STEMScript, WorkspaceMember, FeedbackComment, Workspace } from '@/types/stem';

export const DEFAULT_SAMPLE_SCRIPT: STEMScript = {
  id: 'proj_pendulum_physics_11',
  title: 'Con Lắc Đơn & Dao Động Điều Hòa Vật Lý 11',
  subject: 'Physics',
  gradeLevel: 'Lớp 11',
  totalDurationSeconds: 35,
  scriptStatus: 'APPROVED',
  videoStatus: 'IN_QA',
  fps: 30,
  createdAt: '2026-09-19',
  scenes: [
    {
      id: 'scene_1',
      type: 'TITLE_HERO',
      title: 'Dao Động Tuần Hoàn Của Con Lắc Đơn',
      subtitle: 'Khám phá chu kỳ dao động T, tần số f và gia tốc trọng trường g thông qua chuyển động thực tế',
      subject: 'Physics',
      gradeLevel: 'Lớp 11 • Nâng cao',
      badgeText: 'Chương trình GDPT mới',
      narration: 'Chào mừng các bạn đến với bài học vật lý 11. Hôm nay chúng ta sẽ tìm hiểu cơ chế dao động của con lắc đơn.',
      durationInFrames: 150,
    },
    {
      id: 'scene_2',
      type: 'MATH_FORMULA',
      title: 'Công thức chu kỳ dao động con lắc đơn',
      latex: 'T = 2\\pi \\sqrt{\\frac{l}{g}}',
      narration: 'Chu kỳ dao động T phụ thuộc vào chiều dài dây treo l và gia tốc trọng trường g.',
      durationInFrames: 180,
      steps: [
        {
          label: 'Chiều dài dây l',
          latexSnippet: 'l \\text{ (m)}',
          explanation: 'Chiều dài càng lớn thì chu kỳ T càng tăng (dao động càng chậm).',
        },
        {
          label: 'Gia tốc trọng trường g',
          latexSnippet: 'g \\approx 9.8 \\text{ m/s}^2',
          explanation: 'Phụ thuộc vào vĩ độ địa lý và độ cao so với mặt nước biển.',
        },
        {
          label: 'Tần số góc \\omega',
          latexSnippet: '\\omega = \\sqrt{\\frac{g}{l}}',
          explanation: 'Tần số góc biểu diễn tốc độ biến thiên pha dao động.',
        },
      ],
    },
    {
      id: 'scene_3',
      type: 'DIAGRAM_EXPLAINER',
      title: 'Sơ đồ phân tích lực con lắc đơn',
      diagramTitle: 'Trọng lực P và Lực căng dây T',
      narration: 'Tại vị trí góc lệch alpha, trọng lực P được phân tích thành 2 thành phần tiếp tuyến và pháp tuyến.',
      durationInFrames: 180,
      labels: [
        {
          name: 'Lực căng dây T',
          description: 'Giữ cho vật chuyển động trên cung tròn có bán kính bằng chiều dài dây.',
          xPercent: 50,
          yPercent: 30,
        },
        {
          name: 'Thành phần lực kéo về Pt',
          description: 'Pt = -mg sin(alpha), có xu hướng đưa vật về vị trí cân bằng.',
          xPercent: 70,
          yPercent: 65,
        },
        {
          name: 'Vị trí cân bằng',
          description: 'Điểm thấp nhất của quỹ đạo, nơi vận tốc đạt cực đại và hợp lực lớn nhất.',
          xPercent: 50,
          yPercent: 85,
        },
      ],
    },
    {
      id: 'scene_4',
      type: 'DATA_CHART',
      title: 'Sự phụ thuộc của Chu kỳ T vào Chiều dài l',
      xAxisLabel: 'Chiều dài dây treo l (mét)',
      yAxisLabel: 'Chu kỳ T (giây)',
      narration: 'Thực nghiệm chứng minh khi tăng chiều dài dây gấp 4 lần thì chu kỳ dao động tăng gấp 2 lần.',
      durationInFrames: 150,
      chartType: 'bar',
      dataPoints: [
        { label: 'l = 0.25m', value: 1.0, color: 'linear-gradient(to top, #3b82f6, #60a5fa)' },
        { label: 'l = 0.50m', value: 1.42, color: 'linear-gradient(to top, #6366f1, #818cf8)' },
        { label: 'l = 1.00m', value: 2.01, color: 'linear-gradient(to top, #8b5cf6, #a78bfa)' },
        { label: 'l = 2.00m', value: 2.84, color: 'linear-gradient(to top, #ec4899, #f472b6)' },
      ],
    },
    {
      id: 'scene_5',
      type: 'ALGORITHM_WALKTHROUGH',
      title: 'Mô phỏng số tích phân Euler con lắc trong Python',
      language: 'python',
      codeSnippet: `def update_pendulum(theta, omega, dt, g=9.8, l=1.0):
    alpha = -(g / l) * sin(theta)  # gia toc goc
    omega_new = omega + alpha * dt # van toc goc moi
    theta_new = theta + omega_new * dt
    return theta_new, omega_new`,
      narration: 'Phương pháp tích phân Euler giúp chúng ta tính toán góc lệch và vận tốc góc tại từng bước thời gian dt.',
      durationInFrames: 180,
      steps: [
        {
          lineHighlight: 2,
          variableState: 'theta = 0.15 rad, l = 1.0 m, g = 9.8 -> alpha = -1.46 rad/s^2',
          note: 'Tính gia tốc góc từ mô-men lực phục hồi',
        },
        {
          lineHighlight: 3,
          variableState: 'omega = 0.0 + (-1.46 * 0.01) = -0.0146 rad/s',
          note: 'Cập nhật vận tốc góc sau khoảng thời gian dt = 0.01s',
        },
        {
          lineHighlight: 4,
          variableState: 'theta_new = 0.15 + (-0.0146 * 0.01) = 0.1498 rad',
          note: 'Cập nhật góc lệch mới của con lắc',
        },
      ],
    },
    {
      id: 'scene_6',
      type: 'STEM_QUIZ',
      title: 'Câu hỏi kiểm tra nhanh 30 giây',
      question: 'Nếu đưa con lắc đơn lên Mặt Trăng (nơi g giảm 6 lần), chu kỳ T của con lắc sẽ thay đổi như thế nào?',
      options: [
        'Giảm căn bậc 2 của 6 lần',
        'Tăng căn bậc 2 của 6 lần',
        'Tăng 6 lần',
        'Không thay đổi vì chiều dài dây giữ nguyên',
      ],
      correctIndex: 1,
      hint: 'Hãy nhớ lại công thức T = 2*pi*sqrt(l/g). g nằm dưới mẫu số!',
      explanation: 'Vì T tỉ lệ nghịch với căn bậc hai của g, khi g giảm 6 lần thì căn(g) giảm sqrt(6), do đó T tăng căn 6 lần (~ 2.45 lần).',
      narration: 'Hãy suy nghĩ trong 5 giây: khi đưa con lắc lên Mặt Trăng, chu kỳ dao động sẽ thay đổi ra sao?',
      durationInFrames: 180,
    },
    {
      id: 'scene_7',
      type: 'OUTRO',
      title: 'Tóm tắt bài học & Nhiệm vụ thực hành',
      instructorName: 'Thầy Nguyễn Văn Đức • Bộ môn Vật Lý',
      nextLessonSuggestion: 'Bài 04: Năng lượng trong dao động con lắc đơn (Động năng & Thế năng)',
      narration: 'Như vậy các bạn đã nắm rõ chu kỳ của con lắc đơn. Hãy làm bài tập thực hành trên LMS và đón chờ bài học tiếp theo.',
      durationInFrames: 150,
      summaryPoints: [
        'Chu kỳ T = 2*pi*sqrt(l/g) chỉ phụ thuộc vào chiều dài l và gia tốc g.',
        'Chu kỳ không phụ thuộc vào khối lượng m của vật nặng trong dao động nhỏ.',
        'Đã kiểm chứng thực nghiệm và giải mã bằng thuật toán mô phỏng Python.',
      ],
    },
  ],
};

export const SAMPLE_WORKSPACES: Workspace[] = [
  { id: 'ws_physics', name: 'Tổ Bộ Môn Vật Lý THPT', department: 'Khoa Học Tự Nhiên', membersCount: 8, activeProjects: 14 },
  { id: 'ws_math', name: 'Tổ Toán & Xác Suất Thống Kê', department: 'Toán Ứng Dụng', membersCount: 12, activeProjects: 22 },
  { id: 'ws_chemistry', name: 'Tổ Hóa Học & Thí Nghiệm Ảo', department: 'Khoa Học Tự Nhiên', membersCount: 6, activeProjects: 9 },
  { id: 'ws_cs', name: 'Tổ Tin Học & AI Robotics', department: 'Công Nghệ Thông Tin', membersCount: 15, activeProjects: 31 },
];

export const SAMPLE_MEMBERS: WorkspaceMember[] = [
  { id: 'u1', name: 'TS. Nguyễn Văn Đức', email: 'duc.nguyen@stemotion.edu.vn', role: 'Trưởng bộ môn (Admin)', avatar: '👨‍🏫', status: 'ACTIVE' },
  { id: 'u2', name: 'ThS. Trần Thị Mai', email: 'mai.tran@stemotion.edu.vn', role: 'Writer (Biên kịch)', avatar: '👩‍💻', status: 'ACTIVE' },
  { id: 'u3', name: 'GS. Lê Hoàng Nam', email: 'nam.le@stemotion.edu.vn', role: 'Reviewer (Chuyên gia)', avatar: '🧑‍🔬', status: 'ACTIVE' },
  { id: 'u4', name: 'Kỹ sư Vũ Minh Trí', email: 'tri.vu@stemotion.edu.vn', role: 'Producer (Dựng video)', avatar: '🎬', status: 'ACTIVE' },
  { id: 'u5', name: 'ThS. Phạm Thu Trang', email: 'trang.pham@stemotion.edu.vn', role: 'Reviewer (Chuyên gia)', avatar: '👩‍🏫', status: 'INVITED' },
];

export const SAMPLE_COMMENTS: FeedbackComment[] = [
  {
    id: 'c1',
    author: 'GS. Lê Hoàng Nam (Reviewer)',
    avatar: '🧑‍🔬',
    role: 'Reviewer',
    timestampSec: 6.5,
    sceneId: 'scene_2',
    content: 'Đoạn công thức KaTeX T = 2pi*sqrt(l/g) rất rõ ràng, chuẩn định dạng sách giáo khoa lớp 11 mới.',
    status: 'RESOLVED',
    createdAt: '10 phút trước',
  },
  {
    id: 'c2',
    author: 'TS. Nguyễn Văn Đức (Trưởng bộ môn)',
    avatar: '👨‍🏫',
    role: 'Admin',
    timestampSec: 18.2,
    sceneId: 'scene_5',
    content: 'Phần code Python ở Scene 5 nên chú thích rõ biến dt = 0.01s để học sinh không bị bỡ ngỡ.',
    status: 'OPEN',
    createdAt: '3 phút trước',
  },
];
