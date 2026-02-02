// Mock data for AlinHub learning platform

export const categories = [
  { id: '1', name: 'Web Development', icon: '💻' },
  { id: '2', name: 'Data Science', icon: '📊' },
  { id: '3', name: 'Mobile Development', icon: '📱' },
  { id: '4', name: 'UI/UX Design', icon: '🎨' },
  { id: '5', name: 'Business', icon: '💼' },
  { id: '6', name: 'Languages', icon: '🌍' },
];

export const courses = [
  {
    id: '1',
    title: 'Complete Web Development Bootcamp',
    description: 'Learn HTML, CSS, JavaScript, React, Node.js and more. Build real-world projects and become a full-stack developer.',
    category: 'Web Development',
    categoryId: '1',
    instructor: {
      name: 'Dr. Sarah Johnson',
      bio: 'Senior Software Engineer with 10+ years of experience in web development',
      avatar: '👩‍💻',
    },
    rating: 4.8,
    reviewCount: 342,
    students: 1250,
    level: 'Beginner',
    duration: '12 weeks',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450',
    syllabus: [
      {
        id: '1',
        title: 'Introduction to Web Development',
        lessons: ['What is Web Development?', 'Setting up your environment', 'Basic HTML structure'],
      },
      {
        id: '2',
        title: 'HTML & CSS Fundamentals',
        lessons: ['HTML elements and attributes', 'CSS styling basics', 'Responsive design principles'],
      },
      {
        id: '3',
        title: 'JavaScript Essentials',
        lessons: ['Variables and data types', 'Functions and scope', 'DOM manipulation'],
      },
      {
        id: '4',
        title: 'React Development',
        lessons: ['Components and props', 'State management', 'Building real applications'],
      },
    ],
    reviews: [
      { id: '1', student: 'Ahmed Ali', rating: 5, comment: 'Excellent course! The instructor explains everything clearly.', date: '2026-01-10' },
      { id: '2', student: 'Fatima Hassan', rating: 4, comment: 'Great content, very helpful for beginners.', date: '2026-01-08' },
    ],
  },
  {
    id: '2',
    title: 'Data Science with Python',
    description: 'Master data analysis, visualization, and machine learning with Python. Learn pandas, NumPy, and scikit-learn.',
    category: 'Data Science',
    categoryId: '2',
    instructor: {
      name: 'Prof. Michael Chen',
      bio: 'Data Scientist and ML researcher with PhD in Computer Science',
      avatar: '👨‍🔬',
    },
    rating: 4.9,
    reviewCount: 289,
    students: 980,
    level: 'Intermediate',
    duration: '10 weeks',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450',
    syllabus: [
      {
        id: '1',
        title: 'Python Basics for Data Science',
        lessons: ['Python fundamentals', 'Data structures', 'Working with files'],
      },
      {
        id: '2',
        title: 'Data Analysis with Pandas',
        lessons: ['DataFrames and Series', 'Data cleaning', 'Data transformation'],
      },
      {
        id: '3',
        title: 'Data Visualization',
        lessons: ['Matplotlib basics', 'Seaborn for statistical plots', 'Creating dashboards'],
      },
    ],
    reviews: [
      { id: '1', student: 'Omar Khalil', rating: 5, comment: 'Best data science course I have taken!', date: '2026-01-12' },
    ],
  },
  {
    id: '3',
    title: 'Mobile App Development with React Native',
    description: 'Build cross-platform mobile apps for iOS and Android using React Native and JavaScript.',
    category: 'Mobile Development',
    categoryId: '3',
    instructor: {
      name: 'Emily Rodriguez',
      bio: 'Mobile app developer and tech educator',
      avatar: '👩‍💼',
    },
    rating: 4.7,
    reviewCount: 156,
    students: 650,
    level: 'Intermediate',
    duration: '8 weeks',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450',
    syllabus: [
      {
        id: '1',
        title: 'Getting Started with React Native',
        lessons: ['Setting up development environment', 'React Native basics', 'Understanding components'],
      },
      {
        id: '2',
        title: 'Building UI Components',
        lessons: ['Styling in React Native', 'Navigation', 'Forms and user input'],
      },
    ],
    reviews: [],
  },
  {
    id: '4',
    title: 'UI/UX Design Fundamentals',
    description: 'Learn the principles of user interface and user experience design. Master Figma and create stunning designs.',
    category: 'UI/UX Design',
    categoryId: '4',
    instructor: {
      name: 'Lisa Anderson',
      bio: 'Senior UX Designer at leading tech company',
      avatar: '👩‍🎨',
    },
    rating: 4.8,
    reviewCount: 213,
    students: 890,
    level: 'Beginner',
    duration: '6 weeks',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450',
    syllabus: [
      {
        id: '1',
        title: 'Introduction to UI/UX',
        lessons: ['What is UI/UX?', 'Design thinking process', 'User research methods'],
      },
      {
        id: '2',
        title: 'Design Principles',
        lessons: ['Color theory', 'Typography', 'Layout and composition'],
      },
    ],
    reviews: [
      { id: '1', student: 'Layla Ibrahim', rating: 5, comment: 'Amazing course! I learned so much about design.', date: '2026-01-11' },
    ],
  },
  {
    id: '5',
    title: 'Digital Marketing Essentials',
    description: 'Learn SEO, social media marketing, content marketing, and analytics to grow your online presence.',
    category: 'Business',
    categoryId: '5',
    instructor: {
      name: 'David Thompson',
      bio: 'Digital marketing strategist with 8+ years experience',
      avatar: '👨‍💼',
    },
    rating: 4.6,
    reviewCount: 178,
    students: 720,
    level: 'Beginner',
    duration: '5 weeks',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450',
    syllabus: [
      {
        id: '1',
        title: 'Introduction to Digital Marketing',
        lessons: ['Digital marketing landscape', 'Setting goals', 'Understanding your audience'],
      },
      {
        id: '2',
        title: 'SEO Fundamentals',
        lessons: ['How search engines work', 'Keyword research', 'On-page optimization'],
      },
    ],
    reviews: [],
  },
  {
    id: '6',
    title: 'Spanish for Beginners',
    description: 'Start your journey to Spanish fluency. Learn grammar, vocabulary, and conversation skills.',
    category: 'Languages',
    categoryId: '6',
    instructor: {
      name: 'Maria Garcia',
      bio: 'Native Spanish speaker and certified language teacher',
      avatar: '👩‍🏫',
    },
    rating: 4.9,
    reviewCount: 402,
    students: 1450,
    level: 'Beginner',
    duration: '16 weeks',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=450',
    syllabus: [
      {
        id: '1',
        title: 'Spanish Basics',
        lessons: ['Greetings and introductions', 'Pronunciation guide', 'Basic grammar'],
      },
      {
        id: '2',
        title: 'Everyday Conversations',
        lessons: ['At the restaurant', 'Shopping', 'Asking for directions'],
      },
    ],
    reviews: [
      { id: '1', student: 'Nour Mahmoud', rating: 5, comment: '¡Excelente! I am learning so much.', date: '2026-01-13' },
    ],
  },
];

export const enrolledCourses = [
  {
    courseId: '1',
    progress: 65,
    lastAccessed: '2026-01-14',
    completedLessons: 15,
    totalLessons: 23,
  },
  {
    courseId: '2',
    progress: 30,
    lastAccessed: '2026-01-13',
    completedLessons: 7,
    totalLessons: 18,
  },
  {
    courseId: '4',
    progress: 80,
    lastAccessed: '2026-01-14',
    completedLessons: 12,
    totalLessons: 15,
  },
];

export const achievements = [
  { id: '1', title: 'First Course Completed', icon: '🎓', date: '2025-12-15' },
  { id: '2', title: 'Fast Learner', icon: '⚡', date: '2025-12-20' },
  { id: '3', title: '5 Courses Enrolled', icon: '📚', date: '2026-01-05' },
];

export const teacherCourses = [
  {
    ...courses[0],
    enrolledStudents: 1250,
    completionRate: 68,
    averageRating: 4.8,
  },
  {
    id: '7',
    title: 'Advanced JavaScript Patterns',
    category: 'Web Development',
    enrolledStudents: 450,
    completionRate: 72,
    averageRating: 4.7,
  },
];

export const stats = {
  student: {
    coursesEnrolled: 3,
    coursesCompleted: 1,
    certificatesEarned: 1,
    hoursLearned: 45,
  },
  teacher: {
    totalStudents: 1700,
    activeCourses: 2,
    averageRating: 4.75,
    totalRevenue: 0, // Free platform
  },
  admin: {
    totalUsers: 5420,
    totalCourses: 127,
    activeCourses: 98,
    newUsersThisMonth: 234,
  },
};
