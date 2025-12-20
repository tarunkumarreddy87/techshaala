import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2, Users, BookOpen, FileCheck, GraduationCap } from "lucide-react";

interface TeacherStats {
  totalStudents: number;
  totalCourses: number;
  totalAssignments: number;
  averageGrade: number;
}

interface StudentProgress {
  studentId: number;
  studentName: string;
  totalAssignments: number;
  completedAssignments: number;
  averageGrade: number;
}

export default function TeacherAnalytics() {
  const { data: stats, isLoading: isLoadingStats } = useQuery<TeacherStats>({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: studentProgress, isLoading: isLoadingProgress } = useQuery<StudentProgress[]>({
    queryKey: ["/api/teacher/student-progress"],
  });

  if (isLoadingStats || isLoadingProgress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate assignment completion distribution
  const completionData = studentProgress?.reduce(
    (acc: any[], student: any) => {
      const percentage =
        student.totalAssignments > 0
          ? Math.round((student.completedAssignments / student.totalAssignments) * 100)
          : 0;

      let range = "0-20%";
      if (percentage > 80) range = "80-100%";
      else if (percentage > 60) range = "60-80%";
      else if (percentage > 40) range = "40-60%";
      else if (percentage > 20) range = "20-40%";

      const existing = acc.find((item) => item.name === range);
      if (existing) {
        existing.value++;
      } else {
        acc.push({ name: range, value: 1 });
      }
      return acc;
    },
    []
  ).sort((a: any, b: any) => a.name.localeCompare(b.name));

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      {/* High Level Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Enrolled across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">Created assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageGrade || 0}%</div>
            <p className="text-xs text-muted-foreground">Across all submissions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Completion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {completionData?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution or something else could go here, but let's just use Student Progress Table for now */}
         <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Student Progress Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Enrolled Courses</TableHead>
                  <TableHead>Assignments (Completed/Total)</TableHead>
                  <TableHead>Average Grade</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentProgress?.map((student: any) => (
                  <TableRow key={student.studentId}>
                    <TableCell className="font-medium">{student.studentName}</TableCell>
                    <TableCell>{student.enrolledCourses}</TableCell>
                    <TableCell>
                      {student.completedAssignments} / {student.totalAssignments}
                    </TableCell>
                    <TableCell>{student.averageGrade}%</TableCell>
                    <TableCell>
                      <div className="w-full bg-secondary rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{
                            width: `${
                              student.totalAssignments > 0
                                ? (student.completedAssignments / student.totalAssignments) * 100
                                : 0
                            }%`,
                          }}
                        ></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
