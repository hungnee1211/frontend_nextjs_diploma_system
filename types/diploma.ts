import { solidityPackedKeccak256 } from 'ethers';

// 1. Định nghĩa kiểu dữ liệu cho thông tin bằng cấp
export interface DiplomaData {
  fullName: string;
  dateOfBirth: string; // Định dạng YYYY-MM-DD
  gender: string;
  studentId: string;
  course: string;     // Khóa học (ví dụ: 2020-2024)
  major: string;      // Ngành học
  ranking: string;    // Loại tốt nghiệp (Giỏi, Khá...)
  issueDate: string;  // Ngày cấp bằng
}

export const generateDiplomaHash = (data: DiplomaData) => {
  // Kết hợp các trường theo một thứ tự cố định
  // Lưu ý: Trim() để tránh lỗi băm khác nhau do dấu cách thừa
  return solidityPackedKeccak256(
    ["string", "string", "string", "string", "string", "string", "string", "string"],
    [
      data.fullName.trim(),
      data.dateOfBirth,
      data.gender,
      data.studentId.trim(),
      data.course.trim(),
      data.major.trim(),
      data.ranking,
      data.issueDate
    ]
  );
};

