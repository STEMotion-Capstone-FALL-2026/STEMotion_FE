import {
  Airplane, Atom, BatteryFull, Binary, Bird, Bone, BookOpen, Brain, Bug, Butterfly, Calculator,
  Car, Carrot, ChartBar, ChartLine, ChartPie, Circle, Clock, Cloud, CloudRain, Code, Compass, Cpu,
  Cube, Cylinder, Database, Dna, Drop, DropHalf, Ear, Engine, Equals, Eye, Eyedropper, Factory, Fire,
  Fish, Flask, FlowArrow, Flower, Function as FunctionIcon, Gauge, Gear, GlobeHemisphereWest, Grains, Hammer, Heart,
  Heartbeat, Hexagon, Hourglass, Hurricane, Infinity as InfinityIcon, Key, Laptop, Leaf, Lightbulb, Lightning, Lock,
  Magnet, MathOperations, Microscope, Moon, Mountains, PawPrint, Percent, Person, Pi, Pill, Planet,
  Plant, Plug, PlusMinus, Question, Radioactive, Recycle, Robot, Rocket, Ruler, Scales, ShareNetwork,
  ShootingStar, Sigma, Snowflake, SolarPanel, Sparkle, SpeakerHigh, Sphere, Square, Star, Student, Sun, Syringe,
  Target, Terminal, TestTube, Thermometer, Tooth, Tornado, Train, Tree, TreeStructure, Triangle,
  Trophy, Virus, WaveSine, Waveform, Waves, Wind, Windmill, Wrench,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

/**
 * The approved STEM icon set. Scenes store an icon by its `name`, and the AI
 * may only suggest names from this list.
 *
 * Keep the names in sync with StemIconCatalog.java in STEMotion_BE: the back
 * end hands the same list to Gemini as an enum so it can never invent a name.
 */

export type StemIconGroup =
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'earth'
  | 'math'
  | 'technology'
  | 'engineering'
  | 'general';

export interface StemIconEntry {
  name: string;
  label: string;
  group: StemIconGroup;
  Icon: Icon;
}

const entry = (name: string, Icon: Icon, label: string, group: StemIconGroup): StemIconEntry => ({
  name,
  Icon,
  label,
  group,
});

export const STEM_ICONS: StemIconEntry[] = [
  // Physics
  entry('atom', Atom, 'Nguyên tử', 'physics'),
  entry('lightning', Lightning, 'Điện, tia sét', 'physics'),
  entry('magnet', Magnet, 'Nam châm', 'physics'),
  entry('wave', WaveSine, 'Sóng', 'physics'),
  entry('thermometer', Thermometer, 'Nhiệt độ', 'physics'),
  entry('rocket', Rocket, 'Tên lửa', 'physics'),
  entry('planet', Planet, 'Hành tinh', 'physics'),
  entry('sun', Sun, 'Mặt Trời', 'physics'),
  entry('moon', Moon, 'Mặt Trăng', 'physics'),
  entry('star', Star, 'Ngôi sao', 'physics'),
  entry('shooting-star', ShootingStar, 'Sao băng', 'physics'),
  entry('gauge', Gauge, 'Đồng hồ đo', 'physics'),
  entry('scales', Scales, 'Cân bằng', 'physics'),
  entry('radioactive', Radioactive, 'Phóng xạ', 'physics'),
  entry('lightbulb', Lightbulb, 'Bóng đèn', 'physics'),
  entry('plug', Plug, 'Ổ điện', 'physics'),
  entry('solar-panel', SolarPanel, 'Pin mặt trời', 'physics'),
  entry('windmill', Windmill, 'Cối xay gió', 'physics'),
  entry('waveform', Waveform, 'Âm thanh', 'physics'),
  entry('speaker', SpeakerHigh, 'Loa', 'physics'),
  entry('compass', Compass, 'La bàn', 'physics'),

  // Chemistry
  entry('flask', Flask, 'Bình thí nghiệm', 'chemistry'),
  entry('test-tube', TestTube, 'Ống nghiệm', 'chemistry'),
  entry('eyedropper', Eyedropper, 'Ống nhỏ giọt', 'chemistry'),
  entry('fire', Fire, 'Ngọn lửa', 'chemistry'),
  entry('drop', Drop, 'Giọt nước', 'chemistry'),
  entry('solution', DropHalf, 'Dung dịch', 'chemistry'),
  entry('snowflake', Snowflake, 'Đông đặc', 'chemistry'),
  entry('hexagon', Hexagon, 'Vòng, tinh thể', 'chemistry'),
  entry('recycle', Recycle, 'Tuần hoàn', 'chemistry'),

  // Biology
  entry('dna', Dna, 'ADN', 'biology'),
  entry('virus', Virus, 'Virus', 'biology'),
  entry('bug', Bug, 'Côn trùng', 'biology'),
  entry('microscope', Microscope, 'Kính hiển vi', 'biology'),
  entry('leaf', Leaf, 'Lá cây', 'biology'),
  entry('plant', Plant, 'Cây non', 'biology'),
  entry('tree', Tree, 'Cây', 'biology'),
  entry('flower', Flower, 'Hoa', 'biology'),
  entry('heart', Heart, 'Tim', 'biology'),
  entry('heartbeat', Heartbeat, 'Nhịp tim', 'biology'),
  entry('brain', Brain, 'Não', 'biology'),
  entry('bone', Bone, 'Xương', 'biology'),
  entry('tooth', Tooth, 'Răng', 'biology'),
  entry('eye', Eye, 'Mắt', 'biology'),
  entry('ear', Ear, 'Tai', 'biology'),
  entry('pill', Pill, 'Thuốc', 'biology'),
  entry('syringe', Syringe, 'Tiêm chủng', 'biology'),
  entry('fish', Fish, 'Cá', 'biology'),
  entry('bird', Bird, 'Chim', 'biology'),
  entry('butterfly', Butterfly, 'Bướm', 'biology'),
  entry('animal', PawPrint, 'Động vật', 'biology'),
  entry('person', Person, 'Con người', 'biology'),
  entry('grains', Grains, 'Ngũ cốc', 'biology'),
  entry('vegetable', Carrot, 'Rau củ', 'biology'),

  // Earth science
  entry('globe', GlobeHemisphereWest, 'Trái Đất', 'earth'),
  entry('cloud', Cloud, 'Mây', 'earth'),
  entry('rain', CloudRain, 'Mưa', 'earth'),
  entry('wind', Wind, 'Gió', 'earth'),
  entry('tornado', Tornado, 'Lốc xoáy', 'earth'),
  entry('hurricane', Hurricane, 'Bão', 'earth'),
  entry('mountains', Mountains, 'Núi', 'earth'),
  entry('ocean', Waves, 'Đại dương', 'earth'),

  // Mathematics
  entry('math-operations', MathOperations, 'Phép tính', 'math'),
  entry('function', FunctionIcon, 'Hàm số', 'math'),
  entry('calculator', Calculator, 'Máy tính bỏ túi', 'math'),
  entry('ruler', Ruler, 'Thước đo', 'math'),
  entry('triangle', Triangle, 'Tam giác', 'math'),
  entry('circle', Circle, 'Hình tròn', 'math'),
  entry('square', Square, 'Hình vuông', 'math'),
  entry('cube', Cube, 'Hình lập phương', 'math'),
  entry('sphere', Sphere, 'Hình cầu', 'math'),
  entry('cylinder', Cylinder, 'Hình trụ', 'math'),
  entry('infinity', InfinityIcon, 'Vô cực', 'math'),
  entry('pi', Pi, 'Số Pi', 'math'),
  entry('sigma', Sigma, 'Tổng', 'math'),
  entry('percent', Percent, 'Phần trăm', 'math'),
  entry('chart-line', ChartLine, 'Đồ thị', 'math'),
  entry('chart-bar', ChartBar, 'Biểu đồ cột', 'math'),
  entry('chart-pie', ChartPie, 'Biểu đồ tròn', 'math'),
  entry('plus-minus', PlusMinus, 'Cộng trừ', 'math'),
  entry('equals', Equals, 'Bằng nhau', 'math'),

  // Technology
  entry('cpu', Cpu, 'Bộ vi xử lý', 'technology'),
  entry('code', Code, 'Mã nguồn', 'technology'),
  entry('terminal', Terminal, 'Dòng lệnh', 'technology'),
  entry('database', Database, 'Cơ sở dữ liệu', 'technology'),
  entry('binary', Binary, 'Nhị phân', 'technology'),
  entry('robot', Robot, 'Robot', 'technology'),
  entry('laptop', Laptop, 'Máy tính', 'technology'),
  entry('tree-structure', TreeStructure, 'Cấu trúc cây', 'technology'),
  entry('flow', FlowArrow, 'Luồng xử lý', 'technology'),
  entry('network', ShareNetwork, 'Mạng lưới', 'technology'),
  entry('lock', Lock, 'Bảo mật', 'technology'),
  entry('key', Key, 'Khóa', 'technology'),

  // Engineering
  entry('gear', Gear, 'Bánh răng', 'engineering'),
  entry('wrench', Wrench, 'Cờ lê', 'engineering'),
  entry('hammer', Hammer, 'Búa', 'engineering'),
  entry('engine', Engine, 'Động cơ', 'engineering'),
  entry('car', Car, 'Ô tô', 'engineering'),
  entry('airplane', Airplane, 'Máy bay', 'engineering'),
  entry('train', Train, 'Tàu hỏa', 'engineering'),
  entry('factory', Factory, 'Nhà máy', 'engineering'),
  entry('battery', BatteryFull, 'Pin', 'engineering'),

  // General
  entry('clock', Clock, 'Thời gian', 'general'),
  entry('hourglass', Hourglass, 'Đồng hồ cát', 'general'),
  entry('question', Question, 'Câu hỏi', 'general'),
  entry('target', Target, 'Mục tiêu', 'general'),
  entry('trophy', Trophy, 'Thành tích', 'general'),
  entry('book', BookOpen, 'Sách', 'general'),
  entry('student', Student, 'Học sinh', 'general'),
  entry('sparkle', Sparkle, 'Điểm nhấn', 'general'),
];

const BY_NAME = new Map(STEM_ICONS.map((e) => [e.name, e]));

export const STEM_ICON_NAMES = STEM_ICONS.map((e) => e.name);

/** Unknown names fall back to a question mark instead of breaking the render. */
export const FALLBACK_ICON = BY_NAME.get('question')!;

export const resolveStemIcon = (name: string | undefined): StemIconEntry =>
  (name && BY_NAME.get(name.trim().toLowerCase())) || FALLBACK_ICON;

export const isKnownStemIcon = (name: string | undefined) =>
  !!name && BY_NAME.has(name.trim().toLowerCase());
