export interface Meeting {
  id: number;
  created_at: string;
  course_title: string | null;
  subject: string | null;
  course_number: string | null;
  section_index: string | null;
  instructors: string | null;
  meeting_day: string | null;
  start_time: string | null;
  end_time: string | null;
  building_code: string | null;
  room_number: string | null;
  campus: string | null;
  credits: number | null;
  synopsis_url: string | null;
}