// app.js - نظام إدارة طلاب ذوي الإعاقة السمعية

// ============================================
// 1. تهيئة Firebase
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyCYKp5mi2gDJGg4l5sOURJXGiQQOPDWU3s",
    authDomain: "students-59f43.firebaseapp.com",
    databaseURL: "https://students-59f43-default-rtdb.firebaseio.com",
    projectId: "students-59f43",
    storageBucket: "students-59f43.firebasestorage.app",
    messagingSenderId: "248717629262",
    appId: "1:248717629262:web:a7ee2ad69da4bc6f38f01f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

let currentUser = null;
let currentUserData = null;

// ============================================
// 2. وظائف مساعدة عامة
// ============================================
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'none';
}

function showMessage(message, type = 'info') {
    // إزالة أي رسائل سابقة
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="message-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(messageDiv);
    
    // إضافة الأنماط إذا لم تكن موجودة
    if (!document.querySelector('#message-styles')) {
        const style = document.createElement('style');
        style.id = 'message-styles';
        style.textContent = `
            .message {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 9999;
                animation: slideIn 0.3s ease;
                max-width: 400px;
                border-right: 4px solid #3498db;
            }
            .message-success { border-color: #2ecc71; }
            .message-error { border-color: #e74c3c; }
            .message-info { border-color: #3498db; }
            .message i { font-size: 18px; }
            .message-success i { color: #2ecc71; }
            .message-error i { color: #e74c3c; }
            .message-info i { color: #3498db; }
            .message-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                margin-right: auto;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // إزالة الرسالة بعد 5 ثواني
    setTimeout(() => {
        if (messageDiv.parentElement) messageDiv.remove();
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG');
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    if (!phone) return true;
    const re = /^[\+]?[0-9]{10,15}$/;
    return re.test(phone.replace(/[\s-]/g, ''));
}

// ============================================
// 3. نظام تسجيل الدخول والخروج
// ============================================
function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('البريد الإلكتروني غير صالح', 'error');
        return;
    }
    
    showLoading();
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return database.ref('users/' + user.uid).once('value');
        })
        .then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const role = userData.role;
                
                // توجيه المستخدم حسب دوره
                switch(role) {
                    case 'admin': window.location.href = 'admin.html'; break;
                    case 'teacher': window.location.href = 'teacher.html'; break;
                    case 'specialist': window.location.href = 'specialist.html'; break;
                    case 'parent': window.location.href = 'parent.html'; break;
                    case 'student': window.location.href = 'student.html'; break;
                    default:
                        showMessage('دور المستخدم غير معروف', 'error');
                        hideLoading();
                        auth.signOut();
                }
            } else {
                showMessage('بيانات المستخدم غير موجودة', 'error');
                hideLoading();
                auth.signOut();
            }
        })
        .catch((error) => {
            console.error('Login error:', error);
            hideLoading();
            
            let errorMessage = 'حدث خطأ في تسجيل الدخول';
            switch(error.code) {
                case 'auth/user-not-found': errorMessage = 'المستخدم غير موجود'; break;
                case 'auth/wrong-password': errorMessage = 'كلمة المرور غير صحيحة'; break;
                case 'auth/invalid-email': errorMessage = 'البريد الإلكتروني غير صالح'; break;
                case 'auth/user-disabled': errorMessage = 'هذا الحساب معطل'; break;
            }
            
            showMessage(errorMessage, 'error');
        });
}

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        showLoading();
        auth.signOut()
            .then(() => {
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Logout error:', error);
                hideLoading();
                showMessage('حدث خطأ أثناء تسجيل الخروج', 'error');
            });
    }
}

// ============================================
// 4. نظام المصادقة والصلاحيات
// ============================================
function checkAuth(requiredRole) {
    return new Promise((resolve, reject) => {
        showLoading();
        
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                
                database.ref('users/' + user.uid).once('value')
                    .then((snapshot) => {
                        hideLoading();
                        
                        if (snapshot.exists()) {
                            currentUserData = snapshot.val();
                            
                            if (currentUserData.role === requiredRole) {
                                resolve();
                            } else {
                                window.location.href = 'index.html';
                                reject('ليس لديك صلاحية الدخول إلى هذه الصفحة');
                            }
                        } else {
                            window.location.href = 'index.html';
                            reject('بيانات المستخدم غير موجودة');
                        }
                    })
                    .catch((error) => {
                        hideLoading();
                        window.location.href = 'index.html';
                        reject(error);
                    });
            } else {
                hideLoading();
                window.location.href = 'index.html';
                reject('لم يتم تسجيل الدخول');
            }
        });
    });
}

// ============================================
// 5. وظائف لوحة التحكم العامة
// ============================================
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar) sidebar.classList.toggle('collapsed');
    if (mainContent) mainContent.classList.toggle('expanded');
}

function showSection(sectionId) {
    // إخفاء جميع الأقسام
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // إزالة النشاط من جميع الأزرار
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // إظهار القسم المطلوب
    const activeSection = document.getElementById(sectionId + '-section');
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // تفعيل الزر النشط
    const activeNavLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeNavLink) {
        activeNavLink.classList.add('active');
    }
    
    // تحديث عنوان الصفحة
    updatePageTitle(sectionId);
}

function updatePageTitle(sectionId) {
    const pageTitle = document.getElementById('pageTitle');
    if (!pageTitle) return;
    
    const titles = {
        'home': 'الصفحة الرئيسية',
        'students': 'قائمة الطلاب',
        'add-student': 'إضافة طالب جديد',
        'users': 'جميع المستخدمين',
        'add-user': 'إضافة مستخدم جديد',
        'subjects': 'المواد الدراسية',
        'assign-teachers': 'تعيين معلمين',
        'assign-specialists': 'تعيين أخصائيين',
        'child-profile': 'ملف ابني/ابنتي',
        'child-grades': 'النتائج الدراسية',
        'follow-up': 'المتابعة الطبية',
        'profile': 'الملف الشخصي',
        'grades': 'النتائج الدراسية',
        'my-teachers': 'معلمي',
        'my-specialists': 'أخصائيي',
        'my-students': 'طلابي',
        'add-grade': 'إضافة درجات',
        'grades-list': 'قائمة الدرجات',
        'children': 'جميع الأطفال',
        'add-evaluation': 'إضافة تقييم',
        'evaluations': 'التقييمات السابقة',
        'medical-history': 'التاريخ المرضي'
    };
    
    pageTitle.textContent = titles[sectionId] || 'الصفحة الرئيسية';
}

// ============================================
// 6. نظام إدارة المشرف (admin.html)
// ============================================
function initAdminDashboard() {
    checkAuth('admin').then(() => {
        loadAdminData();
        loadStatistics();
        loadStudentsList();
        loadUsersList();
        loadSubjectsList();
        loadParentsForSelect();
        setupAdminForms();
        
        // تحديث التاريخ
        const dateElements = document.querySelectorAll('#currentDate');
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('ar-EG', options);
        dateElements.forEach(el => { if (el) el.textContent = dateString; });
        
        hideLoading();
    }).catch(error => {
        console.error('Auth error:', error);
        window.location.href = 'index.html';
    });
}

function loadAdminData() {
    if (currentUser && currentUserData) {
        // تحديث اسم المشرف
        const nameElements = document.querySelectorAll('#adminName, #adminWelcomeName');
        nameElements.forEach(el => {
            if (el) el.textContent = currentUserData.fullName || 'المشرف';
        });
        
        // تحديث البريد الإلكتروني
        const emailElement = document.getElementById('currentUserEmail');
        if (emailElement) emailElement.textContent = currentUser.email;
    }
}

function loadStatistics() {
    Promise.all([
        database.ref('students').once('value'),
        database.ref('users').once('value')
    ])
    .then(([studentsSnapshot, usersSnapshot]) => {
        // عدد الطلاب
        const totalStudents = studentsSnapshot.numChildren();
        document.getElementById('totalStudents').textContent = totalStudents;
        
        // عد المستخدمين حسب الدور
        let specialists = 0, teachers = 0, parents = 0, students = 0;
        
        usersSnapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            switch(user.role) {
                case 'specialist': specialists++; break;
                case 'teacher': teachers++; break;
                case 'parent': parents++; break;
                case 'student': students++; break;
            }
        });
        
        document.getElementById('totalSpecialists').textContent = specialists;
        document.getElementById('totalTeachers').textContent = teachers;
        document.getElementById('totalParents').textContent = parents;
    })
    .catch((error) => {
        console.error('Error loading statistics:', error);
    });
}

function loadStudentsList() {
    showLoading();
    
    Promise.all([
        database.ref('students').once('value'),
        database.ref('users').orderByChild('role').equalTo('parent').once('value')
    ])
    .then(([studentsSnapshot, parentsSnapshot]) => {
        const tbody = document.getElementById('adminStudentsTableBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (!studentsSnapshot.exists()) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">
                        <i class="fas fa-info-circle"></i>
                        <span>لا توجد طلاب مسجلين</span>
                    </td>
                </tr>
            `;
            hideLoading();
            return;
        }
        
        // إنشاء خريطة لأولياء الأمور
        const parentsMap = {};
        parentsSnapshot.forEach((snap) => {
            const parent = snap.val();
            parentsMap[snap.key] = {
                name: parent.fullName || 'غير محدد',
                phone: parent.phone || 'غير محدد'
            };
        });
        
        let index = 1;
        studentsSnapshot.forEach((childSnapshot) => {
            const student = childSnapshot.val();
            const studentId = childSnapshot.key;
            
            // الحصول على بيانات ولي الأمر
            let parentName = 'غير محدد';
            let parentPhone = student.parentPhone || 'غير محدد';
            
            if (student.parentId && parentsMap[student.parentId]) {
                parentName = parentsMap[student.parentId].name;
                if (!parentPhone || parentPhone === 'غير محدد') {
                    parentPhone = parentsMap[student.parentId].phone;
                }
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index}</td>
                <td>${student.fullName || 'غير محدد'}</td>
                <td>${student.studentId || 'غير محدد'}</td>
                <td>${student.birthDate || 'غير محدد'}</td>
                <td>${student.disabilityType || 'غير محدد'}</td>
                <td>${parentPhone}</td>
                <td>${parentName}</td>
                <td><span class="status-badge active">نشط</span></td>
                <td>
                    <button type="button" class="btn-icon edit" onclick="editStudent('${studentId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn-icon delete" onclick="deleteStudent('${studentId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            index++;
        });
        
        hideLoading();
    })
    .catch((error) => {
        console.error('Error loading students:', error);
        showMessage('حدث خطأ في تحميل الطلاب', 'error');
        hideLoading();
    });
}

function loadUsersList() {
    showLoading();
    
    database.ref('users').once('value')
        .then((snapshot) => {
            const tbody = document.getElementById('adminUsersTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (!snapshot.exists()) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <span>لا توجد مستخدمين</span>
                        </td>
                    </tr>
                `;
                hideLoading();
                return;
            }
            
            let index = 1;
            snapshot.forEach((childSnapshot) => {
                const user = childSnapshot.val();
                const userId = childSnapshot.key;
                
                // تخطي المستخدم الحالي
                if (userId === currentUser.uid) return;
                
                const roleNames = {
                    'admin': 'مشرف',
                    'teacher': 'معلم',
                    'specialist': 'أخصائي',
                    'parent': 'ولي أمر',
                    'student': 'طالب'
                };
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index}</td>
                    <td>${user.fullName || 'غير محدد'}</td>
                    <td>${user.email || 'غير محدد'}</td>
                    <td><span class="role-badge ${user.role}">${roleNames[user.role] || user.role}</span></td>
                    <td>${formatDate(user.registeredAt)}</td>
                    <td><span class="status-badge ${user.status === 'inactive' ? 'inactive' : 'active'}">${user.status === 'inactive' ? 'غير نشط' : 'نشط'}</span></td>
                    <td>
                        <button type="button" class="btn-icon edit" onclick="editUser('${userId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn-icon delete" onclick="deleteUser('${userId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tbody.appendChild(row);
                index++;
            });
            
            hideLoading();
        })
        .catch((error) => {
            console.error('Error loading users:', error);
            showMessage('حدث خطأ في تحميل المستخدمين', 'error');
            hideLoading();
        });
}

function loadSubjectsList() {
    database.ref('subjects').once('value')
        .then((snapshot) => {
            const tbody = document.getElementById('adminSubjectsTableBody');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (!snapshot.exists()) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <span>لا توجد مواد دراسية</span>
                        </td>
                    </tr>
                `;
                return;
            }
            
            let index = 1;
            snapshot.forEach((childSnapshot) => {
                const subject = childSnapshot.val();
                const subjectId = childSnapshot.key;
                
                // حساب عدد المعلمين لهذه المادة
                database.ref('users').orderByChild('subjectId').equalTo(subjectId).once('value')
                    .then((teachersSnapshot) => {
                        const teacherCount = teachersSnapshot.exists() ? teachersSnapshot.numChildren() : 0;
                        
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${index}</td>
                            <td>${subject.name || 'غير محدد'}</td>
                            <td>${subject.description || 'لا يوجد وصف'}</td>
                            <td>${teacherCount}</td>
                            <td>
                                <button type="button" class="btn-icon edit" onclick="editSubject('${subjectId}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button type="button" class="btn-icon delete" onclick="deleteSubject('${subjectId}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        `;
                        
                        tbody.appendChild(row);
                        index++;
                    });
            });
        })
        .catch((error) => {
            console.error('Error loading subjects:', error);
            showMessage('حدث خطأ في تحميل المواد', 'error');
        });
}

function loadParentsForSelect() {
    database.ref('users').orderByChild('role').equalTo('parent').once('value')
        .then((snapshot) => {
            const parentSelect = document.getElementById('parentId');
            if (!parentSelect) return;
            
            parentSelect.innerHTML = '<option value="">اختر ولي الأمر</option>';
            
            if (!snapshot.exists()) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'لا توجد أولياء أمور';
                parentSelect.appendChild(option);
                return;
            }
            
            snapshot.forEach((childSnapshot) => {
                const parent = childSnapshot.val();
                const option = document.createElement('option');
                option.value = childSnapshot.key;
                option.textContent = `${parent.fullName} ${parent.phone ? '(' + parent.phone + ')' : ''}`;
                option.dataset.phone = parent.phone || '';
                option.dataset.name = parent.fullName || '';
                parentSelect.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error loading parents:', error);
        });
}

function setupAdminForms() {
    // نموذج إضافة طالب
    const addStudentForm = document.getElementById('addStudentForm');
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', handleAddStudent);
    }
    
    // نموذج إضافة مستخدم
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }
    
    // نموذج إضافة مادة
    const addSubjectForm = document.getElementById('addSubjectForm');
    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', handleAddSubject);
    }
    
    // نموذج تعيين معلم
    const assignTeacherForm = document.getElementById('assignTeacherForm');
    if (assignTeacherForm) {
        assignTeacherForm.addEventListener('submit', handleAssignTeacher);
    }
    
    // نموذج تعيين أخصائي
    const assignSpecialistForm = document.getElementById('assignSpecialistForm');
    if (assignSpecialistForm) {
        assignSpecialistForm.addEventListener('submit', handleAssignSpecialist);
    }
}

function handleAddStudent(e) {
    e.preventDefault();
    
    const studentData = {
        fullName: document.getElementById('studentName').value.trim(),
        studentId: document.getElementById('studentId').value.trim(),
        birthDate: document.getElementById('birthDate').value,
        disabilityType: document.getElementById('disabilityType').value,
        gradeLevel: document.getElementById('studentGrade').value,
        email: document.getElementById('studentEmail').value.trim(),
        parentId: document.getElementById('parentId').value,
        parentPhone: document.getElementById('parentPhone').value.trim(),
        notes: document.getElementById('notes').value.trim(),
        createdAt: new Date().toISOString(),
        status: 'active'
    };
    
    // التحقق من البيانات المطلوبة
    if (!studentData.fullName || !studentData.studentId || !studentData.birthDate || 
        !studentData.disabilityType || !studentData.gradeLevel) {
        showMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // التحقق من البريد الإلكتروني
    if (studentData.email && !validateEmail(studentData.email)) {
        showMessage('البريد الإلكتروني غير صالح', 'error');
        return;
    }
    
    // التحقق من رقم الهاتف
    if (studentData.parentPhone && !validatePhone(studentData.parentPhone)) {
        showMessage('رقم الهاتف غير صالح', 'error');
        return;
    }
    
    showLoading();
    
    // التحقق من عدم تكرار رقم الهوية
    database.ref('students').orderByChild('studentId').equalTo(studentData.studentId).once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                throw new Error('يوجد طالب بنفس رقم الهوية');
            }
            
            return database.ref('students').push().set(studentData);
        })
        .then(() => {
            showMessage('تم إضافة الطالب بنجاح', 'success');
            document.getElementById('addStudentForm').reset();
            loadStatistics();
            loadStudentsList();
            showSection('students');
            hideLoading();
        })
        .catch((error) => {
            console.error('Error adding student:', error);
            showMessage(error.message || 'حدث خطأ في إضافة الطالب', 'error');
            hideLoading();
        });
}

function handleAddUser(e) {
    e.preventDefault();
    
    const userData = {
        fullName: document.getElementById('userFullName').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        password: document.getElementById('userPassword').value,
        role: document.getElementById('userRole').value,
        phone: document.getElementById('userPhone').value.trim(),
        registeredAt: new Date().toISOString(),
        status: 'active'
    };
    
    // إذا كان المعلم، أضف المادة
    if (userData.role === 'teacher') {
        userData.subjectId = document.getElementById('userSubject').value;
    }
    
    // التحقق من البيانات
    if (!userData.fullName || !userData.email || !userData.password || !userData.role) {
        showMessage('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (!validateEmail(userData.email)) {
        showMessage('البريد الإلكتروني غير صالح', 'error');
        return;
    }
    
    if (userData.password.length < 6) {
        showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    if (userData.phone && !validatePhone(userData.phone)) {
        showMessage('رقم الهاتف غير صالح', 'error');
        return;
    }
    
    if (userData.role === 'teacher' && !userData.subjectId) {
        showMessage('يرجى اختيار المادة للمعلم', 'error');
        return;
    }
    
    showLoading();
    
    // إنشاء المستخدم في Authentication
    auth.createUserWithEmailAndPassword(userData.email, userData.password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // حفظ بيانات المستخدم في قاعدة البيانات
            const userToSave = {
                uid: user.uid,
                fullName: userData.fullName,
                email: userData.email,
                role: userData.role,
                phone: userData.phone || '',
                subjectId: userData.subjectId || '',
                registeredAt: userData.registeredAt,
                status: userData.status
            };
            
            return database.ref('users/' + user.uid).set(userToSave);
        })
        .then(() => {
            showMessage('تم إضافة المستخدم بنجاح', 'success');
            document.getElementById('addUserForm').reset();
            loadStatistics();
            loadUsersList();
            showSection('users');
            hideLoading();
        })
        .catch((error) => {
            console.error('Error adding user:', error);
            
            let errorMessage = 'حدث خطأ في إضافة المستخدم';
            switch(error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'البريد الإلكتروني مستخدم بالفعل';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'البريد الإلكتروني غير صالح';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'كلمة المرور ضعيفة';
                    break;
            }
            
            showMessage(errorMessage, 'error');
            hideLoading();
        });
}

function handleAddSubject(e) {
    e.preventDefault();
    
    const subjectData = {
        name: document.getElementById('subjectName').value.trim(),
        description: document.getElementById('subjectDescription').value.trim(),
        createdAt: new Date().toISOString()
    };
    
    if (!subjectData.name) {
        showMessage('يرجى إدخال اسم المادة', 'error');
        return;
    }
    
    showLoading();
    
    database.ref('subjects').push().set(subjectData)
        .then(() => {
            showMessage('تم إضافة المادة بنجاح', 'success');
            document.getElementById('addSubjectForm').reset();
            loadSubjectsList();
            hideLoading();
        })
        .catch((error) => {
            console.error('Error adding subject:', error);
            showMessage('حدث خطأ في إضافة المادة', 'error');
            hideLoading();
        });
}

function handleAssignTeacher(e) {
    e.preventDefault();
    
    const assignmentData = {
        studentId: document.getElementById('assignStudent').value,
        teacherId: document.getElementById('assignTeacher').value,
        subjectId: document.getElementById('assignSubject').value,
        assignedAt: new Date().toISOString(),
        assignedBy: currentUser.uid
    };
    
    if (!assignmentData.studentId || !assignmentData.teacherId || !assignmentData.subjectId) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    showLoading();
    
    // التحقق من عدم تكرار التعيين
    database.ref('student_teachers')
        .orderByChild('studentId')
        .equalTo(assignmentData.studentId)
        .once('value')
        .then((snapshot) => {
            let exists = false;
            snapshot.forEach((child) => {
                const assignment = child.val();
                if (assignment.teacherId === assignmentData.teacherId && 
                    assignment.subjectId === assignmentData.subjectId) {
                    exists = true;
                }
            });
            
            if (exists) {
                throw new Error('هذا المعلم مسجل بالفعل لهذا الطالب في نفس المادة');
            }
            
            return database.ref('student_teachers').push().set(assignmentData);
        })
        .then(() => {
            showMessage('تم تعيين المعلم بنجاح', 'success');
            document.getElementById('assignTeacherForm').reset();
            loadAssignedTeachers();
            hideLoading();
        })
        .catch((error) => {
            console.error('Error assigning teacher:', error);
            showMessage(error.message || 'حدث خطأ في تعيين المعلم', 'error');
            hideLoading();
        });
}

function handleAssignSpecialist(e) {
    e.preventDefault();
    
    const assignmentData = {
        studentId: document.getElementById('assignStudentSpecialist').value,
        specialistId: document.getElementById('assignSpecialist').value,
        assignedAt: new Date().toISOString(),
        assignedBy: currentUser.uid
    };
    
    if (!assignmentData.studentId || !assignmentData.specialistId) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    showLoading();
    
    // التحقق من عدم تكرار التعيين
    database.ref('student_specialists')
        .orderByChild('studentId')
        .equalTo(assignmentData.studentId)
        .once('value')
        .then((snapshot) => {
            let exists = false;
            snapshot.forEach((child) => {
                const assignment = child.val();
                if (assignment.specialistId === assignmentData.specialistId) {
                    exists = true;
                }
            });
            
            if (exists) {
                throw new Error('هذا الأخصائي مسجل بالفعل لهذا الطالب');
            }
            
            return database.ref('student_specialists').push().set(assignmentData);
        })
        .then(() => {
            showMessage('تم تعيين الأخصائي بنجاح', 'success');
            document.getElementById('assignSpecialistForm').reset();
            loadAssignedSpecialists();
            hideLoading();
        })
        .catch((error) => {
            console.error('Error assigning specialist:', error);
            showMessage(error.message || 'حدث خطأ في تعيين الأخصائي', 'error');
            hideLoading();
        });
}

function loadAssignedTeachers() {
    const studentId = document.getElementById('assignStudent').value;
    if (!studentId) return;
    
    const tbody = document.getElementById('assignedTeachersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6">جاري التحميل...</td></tr>';
    
    database.ref('student_teachers').orderByChild('studentId').equalTo(studentId).once('value')
        .then((snapshot) => {
            tbody.innerHTML = '';
            
            if (!snapshot.exists()) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <span>لا يوجد معلمون معينون</span>
                        </td>
                    </tr>
                `;
                return;
            }
            
            let index = 1;
            const promises = [];
            
            snapshot.forEach((childSnapshot) => {
                const assignment = childSnapshot.val();
                
                const promise = Promise.all([
                    database.ref('users/' + assignment.teacherId).once('value'),
                    database.ref('subjects/' + assignment.subjectId).once('value')
                ]).then(([teacherSnapshot, subjectSnapshot]) => {
                    const teacher = teacherSnapshot.val();
                    const subject = subjectSnapshot.val();
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${index}</td>
                        <td>${teacher.fullName || 'غير محدد'}</td>
                        <td>${subject.name || 'غير محدد'}</td>
                        <td>${teacher.email || 'غير محدد'}</td>
                        <td>${teacher.phone || 'غير محدد'}</td>
                        <td>
                            <button type="button" class="btn-icon delete" onclick="removeTeacherAssignment('${childSnapshot.key}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                    index++;
                });
                
                promises.push(promise);
            });
            
            Promise.all(promises);
        })
        .catch((error) => {
            console.error('Error loading assigned teachers:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>حدث خطأ في تحميل البيانات</span>
                    </td>
                </tr>
            `;
        });
}

function loadAssignedSpecialists() {
    const studentId = document.getElementById('assignStudentSpecialist').value;
    if (!studentId) return;
    
    const tbody = document.getElementById('assignedSpecialistsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5">جاري التحميل...</td></tr>';
    
    database.ref('student_specialists').orderByChild('studentId').equalTo(studentId).once('value')
        .then((snapshot) => {
            tbody.innerHTML = '';
            
            if (!snapshot.exists()) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <span>لا يوجد أخصائيون معينون</span>
                        </td>
                    </tr>
                `;
                return;
            }
            
            let index = 1;
            snapshot.forEach((childSnapshot) => {
                const assignment = childSnapshot.val();
                
                database.ref('users/' + assignment.specialistId).once('value')
                    .then((specialistSnapshot) => {
                        const specialist = specialistSnapshot.val();
                        
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${index}</td>
                            <td>${specialist.fullName || 'غير محدد'}</td>
                            <td>${specialist.email || 'غير محدد'}</td>
                            <td>${specialist.phone || 'غير محدد'}</td>
                            <td>
                                <button type="button" class="btn-icon delete" onclick="removeSpecialistAssignment('${childSnapshot.key}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        `;
                        
                        tbody.appendChild(row);
                        index++;
                    });
            });
        })
        .catch((error) => {
            console.error('Error loading assigned specialists:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>حدث خطأ في تحميل البيانات</span>
                    </td>
                </tr>
            `;
        });
}

function removeTeacherAssignment(assignmentId) {
    if (confirm('هل أنت متأكد من إزالة هذا المعلم؟')) {
        showLoading();
        database.ref('student_teachers/' + assignmentId).remove()
            .then(() => {
                showMessage('تم إزالة المعلم بنجاح', 'success');
                loadAssignedTeachers();
                hideLoading();
            })
            .catch((error) => {
                console.error('Error removing teacher assignment:', error);
                showMessage('حدث خطأ في إزالة المعلم', 'error');
                hideLoading();
            });
    }
}

function removeSpecialistAssignment(assignmentId) {
    if (confirm('هل أنت متأكد من إزالة هذا الأخصائي؟')) {
        showLoading();
        database.ref('student_specialists/' + assignmentId).remove()
            .then(() => {
                showMessage('تم إزالة الأخصائي بنجاح', 'success');
                loadAssignedSpecialists();
                hideLoading();
            })
            .catch((error) => {
                console.error('Error removing specialist assignment:', error);
                showMessage('حدث خطأ في إزالة الأخصائي', 'error');
                hideLoading();
            });
    }
}

function deleteStudent(studentId) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
        showLoading();
        
        // حذف الطالب وجميع بياناته المرتبطة
        Promise.all([
            database.ref('students/' + studentId).remove(),
            // حذف تعيينات المعلمين
            database.ref('student_teachers').orderByChild('studentId').equalTo(studentId).once('value')
                .then((snapshot) => {
                    const updates = {};
                    snapshot.forEach((child) => {
                        updates['student_teachers/' + child.key] = null;
                    });
                    return database.ref().update(updates);
                }),
            // حذف تعيينات الأخصائيين
            database.ref('student_specialists').orderByChild('studentId').equalTo(studentId).once('value')
                .then((snapshot) => {
                    const updates = {};
                    snapshot.forEach((child) => {
                        updates['student_specialists/' + child.key] = null;
                    });
                    return database.ref().update(updates);
                }),
            // حذف الدرجات
            database.ref('grades').orderByChild('studentId').equalTo(studentId).once('value')
                .then((snapshot) => {
                    const updates = {};
                    snapshot.forEach((child) => {
                        updates['grades/' + child.key] = null;
                    });
                    return database.ref().update(updates);
                }),
            // حذف التقييمات
            database.ref('evaluations').orderByChild('studentId').equalTo(studentId).once('value')
                .then((snapshot) => {
                    const updates = {};
                    snapshot.forEach((child) => {
                        updates['evaluations/' + child.key] = null;
                    });
                    return database.ref().update(updates);
                })
        ])
        .then(() => {
            showMessage('تم حذف الطالب بنجاح', 'success');
            loadStatistics();
            loadStudentsList();
            hideLoading();
        })
        .catch((error) => {
            console.error('Error deleting student:', error);
            showMessage('حدث خطأ في حذف الطالب', 'error');
            hideLoading();
        });
    }
}

function deleteUser(userId) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        showLoading();
        
        // جلب بيانات المستخدم أولاً
        database.ref('users/' + userId).once('value')
            .then((snapshot) => {
                if (!snapshot.exists()) {
                    throw new Error('المستخدم غير موجود');
                }
                
                const userData = snapshot.val();
                
                // حذف المستخدم من Authentication
                return auth.getUserByEmail(userData.email)
                    .then((userRecord) => {
                        return auth.deleteUser(userRecord.uid);
                    })
                    .then(() => {
                        // حذف المستخدم من قاعدة البيانات
                        return database.ref('users/' + userId).remove();
                    });
            })
            .then(() => {
                showMessage('تم حذف المستخدم بنجاح', 'success');
                loadStatistics();
                loadUsersList();
                hideLoading();
            })
            .catch((error) => {
                console.error('Error deleting user:', error);
                showMessage('حدث خطأ في حذف المستخدم', 'error');
                hideLoading();
            });
    }
}

function deleteSubject(subjectId) {
    if (confirm('هل أنت متأكد من حذف هذه المادة؟')) {
        showLoading();
        
        // إزالة المادة من جميع المعلمين أولاً
        database.ref('users').orderByChild('subjectId').equalTo(subjectId).once('value')
            .then((snapshot) => {
                const updates = {};
                snapshot.forEach((child) => {
                    updates['users/' + child.key + '/subjectId'] = '';
                });
                
                if (Object.keys(updates).length > 0) {
                    return database.ref().update(updates);
                }
            })
            .then(() => {
                // حذف المادة
                return database.ref('subjects/' + subjectId).remove();
            })
            .then(() => {
                showMessage('تم حذف المادة بنجاح', 'success');
                loadSubjectsList();
                hideLoading();
            })
            .catch((error) => {
                console.error('Error deleting subject:', error);
                showMessage('حدث خطأ في حذف المادة', 'error');
                hideLoading();
            });
    }
}

// ============================================
// 7. نظام إدارة الطالب (student.html)
// ============================================
function initStudentDashboard() {
    checkAuth('student').then(() => {
        loadStudentData();
        loadStudentGrades();
        loadStudentTeachers();
        loadStudentSpecialists();
        hideLoading();
    }).catch(error => {
        console.error('Auth error:', error);
        window.location.href = 'index.html';
    });
}

function loadStudentData() {
    if (currentUser && currentUserData) {
        // تحديث اسم الطالب
        const nameElements = document.querySelectorAll('#studentName, #studentWelcomeName, #profileStudentName');
        nameElements.forEach(el => {
            if (el) el.textContent = currentUserData.fullName || 'الطالب';
        });
        
        // تحديث البريد الإلكتروني
        const emailElement = document.getElementById('currentUserEmail');
        if (emailElement) emailElement.textContent = currentUser.email;
        
        // تحميل بيانات الطالب الإضافية
        database.ref('students/' + currentUser.uid).once('value')
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const studentData = snapshot.val();
                    updateStudentProfile(studentData);
                }
            })
            .catch((error) => {
                console.error('Error loading student data:', error);
            });
    }
}

function updateStudentProfile(studentData) {
    // تحديث معلومات الملف الشخصي
    const elements = {
        'profileStudentId': studentData.studentId || 'غير محدد',
        'profileBirthDate': studentData.birthDate || 'غير محدد',
        'profileDisability': studentData.disabilityType || 'غير محدد',
        'profileGradeLevel': studentData.gradeLevel || 'غير محدد'
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = elements[id];
    });
    
    // تحميل اسم ولي الأمر
    if (studentData.parentId) {
        database.ref('users/' + studentData.parentId).once('value')
            .then((snapshot) => {
                const parentElement = document.getElementById('profileParent');
                if (parentElement && snapshot.exists()) {
                    parentElement.textContent = snapshot.val().fullName || 'غير محدد';
                }
            });
    }
}

function loadStudentGrades() {
    const tbody = document.getElementById('studentGradesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6">جاري التحميل...</td></tr>';
    
    database.ref('grades').orderByChild('studentId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            tbody.innerHTML = '';
            
            if (!snapshot.exists()) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <span>لا توجد درجات</span>
                        </td>
                    </tr>
                `;
                return;
            }
            
            let index = 1;
            let totalScore = 0;
            let count = 0;
            
            snapshot.forEach((childSnapshot) => {
                const grade = childSnapshot.val();
                
                // حساب التقدير
                let gradeLetter = 'غير محدد';
                if (grade.gradeScore >= 90) gradeLetter = 'ممتاز';
                else if (grade.gradeScore >= 80) gradeLetter = 'جيد جداً';
                else if (grade.gradeScore >= 70) gradeLetter = 'جيد';
                else if (grade.gradeScore >= 60) gradeLetter = 'مقبول';
                else if (grade.gradeScore > 0) gradeLetter = 'راسب';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index}</td>
                    <td>${grade.subject || 'غير محدد'}</td>
                    <td>${grade.gradeScore || 0}</td>
                    <td><span class="grade-badge ${gradeLetter}">${gradeLetter}</span></td>
                    <td>${grade.gradeDate || 'غير محدد'}</td>
                    <td>${grade.gradeNotes || 'لا توجد ملاحظات'}</td>
                `;
                
                tbody.appendChild(row);
                
                if (grade.gradeScore) {
                    totalScore += grade.gradeScore;
                    count++;
                }
                
                index++;
            });
            
            // تحديث الإحصائيات
            if (count > 0) {
                const average = Math.round(totalScore / count);
                const averageElement = document.getElementById('averageGrade');
                const subjectsElement = document.getElementById('subjectsCount');
                
                if (averageElement) averageElement.textContent = average + '%';
                if (subjectsElement) subjectsElement.textContent = count;
            }
        })
        .catch((error) => {
            console.error('Error loading grades:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>حدث خطأ في تحميل الدرجات</span>
                    </td>
                </tr>
            `;
        });
}

function loadStudentTeachers() {
    const container = document.getElementById('myTeachersContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">جاري تحميل بيانات المعلمين...</div>';
    
    database.ref('student_teachers').orderByChild('studentId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            container.innerHTML = '';
            
            if (!snapshot.exists()) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-info-circle"></i>
                        <span>لا يوجد معلمون معينون</span>
                    </div>
                `;
                return;
            }
            
            snapshot.forEach((childSnapshot) => {
                const assignment = childSnapshot.val();
                
                Promise.all([
                    database.ref('users/' + assignment.teacherId).once('value'),
                    database.ref('subjects/' + assignment.subjectId).once('value')
                ]).then(([teacherSnapshot, subjectSnapshot]) => {
                    const teacher = teacherSnapshot.val();
                    const subject = subjectSnapshot.val();
                    
                    const teacherCard = document.createElement('div');
                    teacherCard.className = 'teacher-card';
                    teacherCard.innerHTML = `
                        <div class="teacher-header">
                            <div class="teacher-avatar">
                                <i class="fas fa-chalkboard-teacher"></i>
                            </div>
                            <div class="teacher-info">
                                <h3>${teacher.fullName || 'غير محدد'}</h3>
                                <span class="teacher-subject">${subject.name || 'غير محدد'}</span>
                            </div>
                        </div>
                        <div class="teacher-details">
                            <div class="detail">
                                <i class="fas fa-envelope"></i>
                                <span>${teacher.email || 'غير محدد'}</span>
                            </div>
                            <div class="detail">
                                <i class="fas fa-phone"></i>
                                <span>${teacher.phone || 'غير محدد'}</span>
                            </div>
                        </div>
                    `;
                    
                    container.appendChild(teacherCard);
                });
            });
        })
        .catch((error) => {
            console.error('Error loading teachers:', error);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>حدث خطأ في تحميل المعلمين</span>
                </div>
            `;
        });
}

function loadStudentSpecialists() {
    const container = document.getElementById('mySpecialistsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">جاري تحميل بيانات الأخصائيين...</div>';
    
    database.ref('student_specialists').orderByChild('studentId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            container.innerHTML = '';
            
            if (!snapshot.exists()) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-info-circle"></i>
                        <span>لا يوجد أخصائيون معينون</span>
                    </div>
                `;
                return;
            }
            
            snapshot.forEach((childSnapshot) => {
                const assignment = childSnapshot.val();
                
                database.ref('users/' + assignment.specialistId).once('value')
                    .then((specialistSnapshot) => {
                        const specialist = specialistSnapshot.val();
                        
                        const specialistCard = document.createElement('div');
                        specialistCard.className = 'specialist-card';
                        specialistCard.innerHTML = `
                            <div class="specialist-header">
                                <div class="specialist-avatar">
                                    <i class="fas fa-user-md"></i>
                                </div>
                                <div class="specialist-info">
                                    <h3>${specialist.fullName || 'غير محدد'}</h3>
                                    <span class="specialist-role">أخصائي</span>
                                </div>
                            </div>
                            <div class="specialist-details">
                                <div class="detail">
                                    <i class="fas fa-envelope"></i>
                                    <span>${specialist.email || 'غير محدد'}</span>
                                </div>
                                <div class="detail">
                                    <i class="fas fa-phone"></i>
                                    <span>${specialist.phone || 'غير محدد'}</span>
                                </div>
                            </div>
                        `;
                        
                        container.appendChild(specialistCard);
                    });
            });
        })
        .catch((error) => {
            console.error('Error loading specialists:', error);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>حدث خطأ في تحميل الأخصائيين</span>
                </div>
            `;
        });
}

// ============================================
// 8. نظام إدارة ولي الأمر (parent.html)
// ============================================
function initParentDashboard() {
    checkAuth('parent').then(() => {
        loadParentData();
        loadChildData();
        hideLoading();
    }).catch(error => {
        console.error('Auth error:', error);
        window.location.href = 'index.html';
    });
}

function loadParentData() {
    if (currentUser && currentUserData) {
        const nameElements = document.querySelectorAll('#parentName, #parentWelcomeName');
        nameElements.forEach(el => {
            if (el) el.textContent = currentUserData.fullName || 'ولي الأمر';
        });
        
        const emailElement = document.getElementById('currentUserEmail');
        if (emailElement) emailElement.textContent = currentUser.email;
    }
}

function loadChildData() {
    // البحث عن الطفل المرتبط بهذا ولي الأمر
    database.ref('students').orderByChild('parentId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                showNoChildMessage();
                return;
            }
            
            // افترض أن كل ولي أمر له طفل واحد فقط
            const childId = Object.keys(snapshot.val())[0];
            const childData = snapshot.val()[childId];
            
            displayChildInfo(childData);
            loadChildGrades(childId);
            loadChildMedicalHistory(childId);
            
            // حفظ childId في بيانات المستخدم
            database.ref('users/' + currentUser.uid).update({
                childId: childId
            });
        })
        .catch((error) => {
            console.error('Error loading child data:', error);
            showNoChildMessage();
        });
}

function displayChildInfo(childData) {
    const childInfoCard = document.getElementById('childInfoCard');
    if (!childInfoCard) return;
    
    childInfoCard.innerHTML = `
        <div class="child-info-header">
            <div class="child-avatar">
                <i class="fas fa-child"></i>
            </div>
            <div class="child-info">
                <h3>${childData.fullName || 'غير محدد'}</h3>
                <p>رقم الهوية: ${childData.studentId || 'غير محدد'}</p>
            </div>
        </div>
        <div class="child-details">
            <div class="detail-item">
                <span class="detail-label">تاريخ الميلاد:</span>
                <span class="detail-value">${childData.birthDate || 'غير محدد'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">الصف الدراسي:</span>
                <span class="detail-value">${childData.gradeLevel || 'غير محدد'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">نوع الإعاقة:</span>
                <span class="detail-value">${childData.disabilityType || 'غير محدد'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">البريد الإلكتروني:</span>
                <span class="detail-value">${childData.email || 'غير محدد'}</span>
            </div>
        </div>
        <div class="child-actions">
            <button class="btn btn-primary" onclick="showSection('child-profile')">
                <i class="fas fa-child"></i> عرض الملف الشخصي الكامل
            </button>
        </div>
    `;
    
    // تحديث الملف الشخصي الكامل
    updateChildProfile(childData);
}

function updateChildProfile(childData) {
    const profileContent = document.getElementById('childProfileContent');
    if (!profileContent) return;
    
    profileContent.innerHTML = `
        <div class="child-profile-card">
            <div class="profile-section">
                <h3><i class="fas fa-user"></i> المعلومات الشخصية</h3>
                <div class="profile-grid">
                    <div class="profile-item">
                        <label>الاسم الكامل:</label>
                        <span>${childData.fullName || 'غير محدد'}</span>
                    </div>
                    <div class="profile-item">
                        <label>رقم الهوية:</label>
                        <span>${childData.studentId || 'غير محدد'}</span>
                    </div>
                    <div class="profile-item">
                        <label>تاريخ الميلاد:</label>
                        <span>${childData.birthDate || 'غير محدد'}</span>
                    </div>
                    <div class="profile-item">
                        <label>نوع الإعاقة:</label>
                        <span>${childData.disabilityType || 'غير محدد'}</span>
                    </div>
                    <div class="profile-item">
                        <label>الصف الدراسي:</label>
                        <span>${childData.gradeLevel || 'غير محدد'}</span>
                    </div>
                    <div class="profile-item">
                        <label>البريد الإلكتروني:</label>
                        <span>${childData.email || 'غير محدد'}</span>
                    </div>
                </div>
            </div>
            <div class="profile-section">
                <h3><i class="fas fa-stethoscope"></i> المعلومات الطبية</h3>
                <div class="profile-grid">
                    <div class="profile-item">
                        <label>الملاحظات الطبية:</label>
                        <span>${childData.medicalNotes || 'لا توجد ملاحظات'}</span>
                    </div>
                </div>
            </div>
            <div class="profile-section">
                <h3><i class="fas fa-school"></i> المعلومات الأكاديمية</h3>
                <div class="profile-grid">
                    <div class="profile-item">
                        <label>الملاحظات العامة:</label>
                        <span>${childData.notes || 'لا توجد ملاحظات'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function loadChildGrades(childId) {
    const container = document.getElementById('childGradesContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">جاري تحميل الدرجات...</div>';
    
    database.ref('grades').orderByChild('studentId').equalTo(childId).once('value')
        .then((snapshot) => {
            container.innerHTML = '';
            
            if (!snapshot.exists()) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-info-circle"></i>
                        <span>لا توجد درجات</span>
                    </div>
                `;
                return;
            }
            
            let totalScore = 0;
            let count = 0;
            const subjects = new Set();
            
            snapshot.forEach((childSnapshot) => {
                const grade = childSnapshot.val();
                
                if (grade.gradeScore) {
                    totalScore += grade.gradeScore;
                    count++;
                }
                
                if (grade.subject) {
                    subjects.add(grade.subject);
                }
            });
            
            const average = count > 0 ? Math.round(totalScore / count) : 0;
            
            container.innerHTML = `
                <div class="grades-summary">
                    <div class="summary-card">
                        <div class="summary-icon">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="summary-info">
                            <h4>عدد المواد</h4>
                            <div class="summary-value">${subjects.size}</div>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="summary-info">
                            <h4>المتوسط العام</h4>
                            <div class="summary-value">${average}%</div>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="summary-info">
                            <h4>عدد الاختبارات</h4>
                            <div class="summary-value">${count}</div>
                        </div>
                    </div>
                </div>
                
                <div class="grades-table">
                    <h3>تفاصيل الدرجات</h3>
                    <div class="table-responsive">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>المادة</th>
                                    <th>نوع الاختبار</th>
                                    <th>التاريخ</th>
                                    <th>الدرجة</th>
                                    <th>ملاحظات المعلم</th>
                                </tr>
                            </thead>
                            <tbody id="childGradesTableBody">
                                <!-- سيتم ملؤها بالجافاسكريبت -->
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            const tbody = document.getElementById('childGradesTableBody');
            let index = 1;
            
            snapshot.forEach((childSnapshot) => {
                const grade = childSnapshot.val();
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index}</td>
                    <td>${grade.subject || 'غير محدد'}</td>
                    <td>${grade.gradeType || 'غير محدد'}</td>
                    <td>${grade.gradeDate || 'غير محدد'}</td>
                    <td>${grade.gradeScore || 0}</td>
                    <td>${grade.gradeNotes || 'لا توجد ملاحظات'}</td>
                `;
                
                tbody.appendChild(row);
                index++;
            });
        })
        .catch((error) => {
            console.error('Error loading child grades:', error);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>حدث خطأ في تحميل الدرجات</span>
                </div>
            `;
        });
}

function loadChildMedicalHistory(childId) {
    const container = document.getElementById('follow-upContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">جاري تحميل السجلات الطبية...</div>';
    
    database.ref('evaluations').orderByChild('studentId').equalTo(childId).once('value')
        .then((snapshot) => {
            container.innerHTML = '';
            
            if (!snapshot.exists()) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-info-circle"></i>
                        <span>لا توجد سجلات طبية</span>
                    </div>
                `;
                return;
            }
            
            snapshot.forEach((childSnapshot) => {
                const evaluation = childSnapshot.val();
                
                const evaluationCard = document.createElement('div');
                evaluationCard.className = 'evaluation-card';
                evaluationCard.innerHTML = `
                    <div class="evaluation-header">
                        <span class="evaluation-date">${evaluation.evalDate || 'غير محدد'}</span>
                        <span class="evaluation-type">${evaluation.evalType || 'غير محدد'}</span>
                    </div>
                    <div class="evaluation-content">
                        <div class="evaluation-item">
                            <label>الأخصائي:</label>
                            <span>${evaluation.specialistName || 'غير محدد'}</span>
                        </div>
                        <div class="evaluation-item">
                            <label>الدرجة:</label>
                            <span>${evaluation.evalScore || 0}/100</span>
                        </div>
                        <div class="evaluation-item">
                            <label>الملاحظات:</label>
                            <p>${evaluation.evalNotes || 'لا توجد ملاحظات'}</p>
                        </div>
                    </div>
                `;
                
                container.appendChild(evaluationCard);
            });
        })
        .catch((error) => {
            console.error('Error loading medical history:', error);
            container.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>حدث خطأ في تحميل السجلات الطبية</span>
                </div>
            `;
        });
}

function showNoChildMessage() {
    const childInfoCard = document.getElementById('childInfoCard');
    if (childInfoCard) {
        childInfoCard.innerHTML = `
            <div class="no-child-message">
                <i class="fas fa-child"></i>
                <h3>لا يوجد طفل مرتبط بحسابك</h3>
                <p>يرجى التواصل مع المشرف لإضافة طفل إلى حسابك</p>
            </div>
        `;
    }
}

// ============================================
// 9. نظام إدارة المعلم (teacher.html)
// ============================================
function initTeacherDashboard() {
    checkAuth('teacher').then(() => {
        loadTeacherData();
        loadTeacherStudents();
        loadTeacherGrades();
        setupTeacherForms();
        hideLoading();
    }).catch(error => {
        console.error('Auth error:', error);
        window.location.href = 'index.html';
    });
}

function loadTeacherData() {
    if (currentUser && currentUserData) {
        const nameElements = document.querySelectorAll('#teacherName, #teacherWelcomeName');
        nameElements.forEach(el => {
            if (el) el.textContent = currentUserData.fullName || 'المعلم';
        });
        
        const emailElement = document.getElementById('currentUserEmail');
        if (emailElement) emailElement.textContent = currentUser.email;
        
        // تحميل اسم المادة
        if (currentUserData.subjectId) {
            database.ref('subjects/' + currentUserData.subjectId).once('value')
                .then((snapshot) => {
                    const subjectElement = document.getElementById('teacherSubject');
                    const currentSubjectElement = document.getElementById('currentSubject');
                    
                    if (subjectElement && snapshot.exists()) {
                        subjectElement.textContent = snapshot.val().name || 'غير محدد';
                    }
                    
                    if (currentSubjectElement && snapshot.exists()) {
                        currentSubjectElement.textContent = snapshot.val().name || 'غير محدد';
                    }
                });
        }
    }
}

function loadTeacherStudents() {
    const tbody = document.getElementById('teacherStudentsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="8">جاري التحميل...</td></tr>';
    
    // جلب الطلاب المعينين لهذا المعلم
    database.ref('student_teachers').orderByChild('teacherId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            tbody.innerHTML = '';
            
            if (!snapshot.exists()) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <span>لا توجد طلاب معينين</span>
                        </td>
                    </tr>
                `;
                return;
            }
            
            const studentIds = new Set();
            snapshot.forEach((child) => {
                studentIds.add(child.val().studentId);
            });
            
            if (studentIds.size === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <span>لا توجد طلاب معينين</span>
                        </td>
                    </tr>
                `;
                return;
            }
            
            // تحديث عدد الطلاب
            const studentsCountElement = document.getElementById('subjectStudentsCount');
            if (studentsCountElement) {
                studentsCountElement.textContent = studentIds.size;
            }
            
            // تحميل بيانات كل طالب
            let index = 1;
            studentIds.forEach((studentId) => {
                Promise.all([
                    database.ref('students/' + studentId).once('value'),
                    database.ref('grades')
                        .orderByChild('studentId')
                        .equalTo(studentId)
                        .once('value')
                ]).then(([studentSnapshot, gradesSnapshot]) => {
                    if (!studentSnapshot.exists()) return;
                    
                    const student = studentSnapshot.val();
                    
                    // حساب متوسط درجات الطالب
                    let totalScore = 0;
                    let gradeCount = 0;
                    let lastGrade = 0;
                    
                    if (gradesSnapshot.exists()) {
                        gradesSnapshot.forEach((gradeChild) => {
                            const grade = gradeChild.val();
                            if (grade.teacherId === currentUser.uid && grade.gradeScore) {
                                totalScore += grade.gradeScore;
                                gradeCount++;
                                lastGrade = grade.gradeScore;
                            }
                        });
                    }
                    
                    const average = gradeCount > 0 ? Math.round(totalScore / gradeCount) : 0;
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${index}</td>
                        <td>${student.fullName || 'غير محدد'}</td>
                        <td>${student.gradeLevel || 'غير محدد'}</td>
                        <td>${lastGrade}</td>
                        <td>${average}%</td>
                        <td>${gradeCount}</td>
                        <td><span class="attendance-badge حاضر">حاضر</span></td>
                        <td>
                            <button type="button" class="btn-icon add-grade" onclick="addGradeForStudent('${studentId}')">
                                <i class="fas fa-plus"></i> إضافة درجة
                            </button>
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                    index++;
                });
            });
        })
        .catch((error) => {
            console.error('Error loading teacher students:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="no-data">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>حدث خطأ في تحميل الطلاب</span>
                    </td>
                </tr>
            `;
        });
}

function loadTeacherGrades() {
    const tbody = document.getElementById('gradesListTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7">جاري التحميل...</td></tr>';
    
    database.ref('grades').orderByChild('teacherId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            tbody.innerHTML = '';
            
            if (!snapshot.exists()) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <span>لا توجد درجات</span>
                        </td>
                    </tr>
                `;
                return;
            }
            
            let index = 1;
            let totalScore = 0;
            let count = 0;
            
            snapshot.forEach((childSnapshot) => {
                const grade = childSnapshot.val();
                const gradeId = childSnapshot.key;
                
                // حساب التقدير
                let gradeLetter = 'غير محدد';
                if (grade.gradeScore >= 90) gradeLetter = 'ممتاز';
                else if (grade.gradeScore >= 80) gradeLetter = 'جيد جداً';
                else if (grade.gradeScore >= 70) gradeLetter = 'جيد';
                else if (grade.gradeScore >= 60) gradeLetter = 'مقبول';
                else if (grade.gradeScore > 0) gradeLetter = 'راسب';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index}</td>
                    <td>${grade.studentName || 'غير محدد'}</td>
                    <td>${grade.gradeType || 'غير محدد'}</td>
                    <td>${grade.gradeDate || 'غير محدد'}</td>
                    <td>${grade.gradeScore || 0}</td>
                    <td><span class="grade-badge ${gradeLetter}">${gradeLetter}</span></td>
                    <td>
                        <button type="button" class="btn-icon delete" onclick="deleteGrade('${gradeId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tbody.appendChild(row);
                
                if (grade.gradeScore) {
                    totalScore += grade.gradeScore;
                    count++;
                }
                
                index++;
            });
            
            // تحديث المتوسط
            if (count > 0) {
                const average = Math.round(totalScore / count);
                const averageElement = document.getElementById('averageScore');
                if (averageElement) averageElement.textContent = average + '%';
            }
        })
        .catch((error) => {
            console.error('Error loading teacher grades:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>حدث خطأ في تحميل الدرجات</span>
                    </td>
                </tr>
            `;
        });
}

function setupTeacherForms() {
    const addGradeForm = document.getElementById('addGradeForm');
    if (addGradeForm) {
        addGradeForm.addEventListener('submit', handleAddGrade);
        
        // تعيين تاريخ اليوم
        const today = new Date().toISOString().split('T')[0];
        const gradeDateInput = document.getElementById('gradeDate');
        if (gradeDateInput) gradeDateInput.value = today;
        
        // تحميل الطلاب في القائمة المنسدلة
        loadStudentsForGradeSelect();
    }
}

function loadStudentsForGradeSelect() {
    const select = document.getElementById('gradeStudent');
    if (!select) return;
    
    select.innerHTML = '<option value="">اختر الطالب</option>';
    
    database.ref('student_teachers').orderByChild('teacherId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) return;
            
            const studentIds = new Set();
            snapshot.forEach((child) => {
                studentIds.add(child.val().studentId);
            });
            
            studentIds.forEach((studentId) => {
                database.ref('students/' + studentId).once('value')
                    .then((studentSnapshot) => {
                        if (studentSnapshot.exists()) {
                            const student = studentSnapshot.val();
                            const option = document.createElement('option');
                            option.value = studentId;
                            option.textContent = student.fullName || 'طالب غير محدد';
                            select.appendChild(option);
                        }
                    });
            });
        });
}

function handleAddGrade(e) {
    e.preventDefault();
    
    const gradeData = {
        studentId: document.getElementById('gradeStudent').value,
        gradeType: document.getElementById('gradeType').value,
        gradeDate: document.getElementById('gradeDate').value,
        gradeScore: parseInt(document.getElementById('gradeScore').value),
        gradeNotes: document.getElementById('gradeNotes').value.trim(),
        teacherId: currentUser.uid,
        teacherName: currentUserData.fullName || 'المعلم',
        createdAt: new Date().toISOString()
    };
    
    // التحقق من البيانات
    if (!gradeData.studentId || !gradeData.gradeType || !gradeData.gradeDate || 
        isNaN(gradeData.gradeScore) || gradeData.gradeScore < 0 || gradeData.gradeScore > 100) {
        showMessage('يرجى إدخال بيانات صحيحة', 'error');
        return;
    }
    
    showLoading();
    
    // الحصول على اسم الطالب والمادة
    Promise.all([
        database.ref('students/' + gradeData.studentId).once('value'),
        database.ref('subjects/' + currentUserData.subjectId).once('value')
    ])
    .then(([studentSnapshot, subjectSnapshot]) => {
        if (!studentSnapshot.exists()) {
            throw new Error('الطالب غير موجود');
        }
        
        const student = studentSnapshot.val();
        const subject = subjectSnapshot.exists() ? subjectSnapshot.val().name : 'غير محدد';
        
        gradeData.studentName = student.fullName || 'غير محدد';
        gradeData.subject = subject;
        
        return database.ref('grades').push().set(gradeData);
    })
    .then(() => {
        showMessage('تم إضافة الدرجة بنجاح', 'success');
        document.getElementById('addGradeForm').reset();
        loadTeacherGrades();
        loadTeacherStudents();
        hideLoading();
    })
    .catch((error) => {
        console.error('Error adding grade:', error);
        showMessage('حدث خطأ في إضافة الدرجة', 'error');
        hideLoading();
    });
}

function addGradeForStudent(studentId) {
    showSection('add-grade');
    
    const select = document.getElementById('gradeStudent');
    if (select) {
        select.value = studentId;
    }
}

function deleteGrade(gradeId) {
    if (confirm('هل أنت متأكد من حذف هذه الدرجة؟')) {
        showLoading();
        database.ref('grades/' + gradeId).remove()
            .then(() => {
                showMessage('تم حذف الدرجة بنجاح', 'success');
                loadTeacherGrades();
                hideLoading();
            })
            .catch((error) => {
                console.error('Error deleting grade:', error);
                showMessage('حدث خطأ في حذف الدرجة', 'error');
                hideLoading();
            });
    }
}

// ============================================
// 10. نظام إدارة الأخصائي (specialist.html)
// ============================================
function initSpecialistDashboard() {
    checkAuth('specialist').then(() => {
        loadSpecialistData();
        loadSpecialistChildren();
        loadSpecialistEvaluations();
        setupSpecialistForms();
        hideLoading();
    }).catch(error => {
        console.error('Auth error:', error);
        window.location.href = 'index.html';
    });
}

function loadSpecialistData() {
    if (currentUser && currentUserData) {
        const nameElements = document.querySelectorAll('#specialistName, #specialistWelcomeName');
        nameElements.forEach(el => {
            if (el) el.textContent = currentUserData.fullName || 'الأخصائي';
        });
        
        const emailElement = document.getElementById('currentUserEmail');
        if (emailElement) emailElement.textContent = currentUser.email;
    }
}

function loadSpecialistChildren() {
    const tbody = document.getElementById('specialistChildrenTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7">جاري التحميل...</td></tr>';
    
    // جلب الأطفال المعينين لهذا الأخصائي
    database.ref('student_specialists').orderByChild('specialistId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            tbody.innerHTML = '';
            
            if (!snapshot.exists()) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <span>لا توجد أطفال معينين</span>
                        </td>
                    </tr>
                `;
                return;
            }
            
            const studentIds = new Set();
            snapshot.forEach((child) => {
                studentIds.add(child.val().studentId);
            });
            
            // تحديث عدد الأطفال
            const childrenCountElement = document.getElementById('childrenCount');
            if (childrenCountElement) {
                childrenCountElement.textContent = studentIds.size;
            }
            
            // تحميل بيانات كل طفل
            let index = 1;
            studentIds.forEach((studentId) => {
                Promise.all([
                    database.ref('students/' + studentId).once('value'),
                    database.ref('evaluations')
                        .orderByChild('studentId')
                        .equalTo(studentId)
                        .limitToLast(1)
                        .once('value')
                ]).then(([studentSnapshot, evaluationSnapshot]) => {
                    if (!studentSnapshot.exists()) return;
                    
                    const student = studentSnapshot.val();
                    
                    // حساب العمر
                    let age = 'غير محدد';
                    if (student.birthDate) {
                        const birthDate = new Date(student.birthDate);
                        const today = new Date();
                        age = today.getFullYear() - birthDate.getFullYear();
                    }
                    
                    // الحصول على آخر تقييم
                    let lastEvaluation = 'لا يوجد';
                    let lastEvaluationDate = 'غير محدد';
                    let progressLevel = 'غير محدد';
                    
                    if (evaluationSnapshot.exists()) {
                        evaluationSnapshot.forEach((evalChild) => {
                            const evaluation = evalChild.val();
                            lastEvaluation = evaluation.evalType || 'غير محدد';
                            lastEvaluationDate = evaluation.evalDate || 'غير محدد';
                            
                            if (evaluation.evalScore >= 90) progressLevel = 'ممتاز';
                            else if (evaluation.evalScore >= 80) progressLevel = 'جيد جداً';
                            else if (evaluation.evalScore >= 70) progressLevel = 'جيد';
                            else if (evaluation.evalScore >= 60) progressLevel = 'مقبول';
                            else if (evaluation.evalScore > 0) progressLevel = 'يحتاج تحسين';
                        });
                    }
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${index}</td>
                        <td>${student.fullName || 'غير محدد'}</td>
                        <td>${age}</td>
                        <td>${student.disabilityType || 'غير محدد'}</td>
                        <td>${lastEvaluation}</td>
                        <td><span class="progress-level ${progressLevel}">${progressLevel}</span></td>
                        <td>
                            <button type="button" class="btn-icon add-eval" onclick="addEvaluationForChild('${studentId}')">
                                <i class="fas fa-clipboard-check"></i> تقييم
                            </button>
                        </td>
                    `;
                    
                    tbody.appendChild(row);
                    index++;
                });
            });
        })
        .catch((error) => {
            console.error('Error loading specialist children:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>حدث خطأ في تحميل الأطفال</span>
                    </td>
                </tr>
            `;
        });
}

function loadSpecialistEvaluations() {
    const tbody = document.getElementById('evaluationsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6">جاري التحميل...</td></tr>';
    
    database.ref('evaluations').orderByChild('specialistId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            tbody.innerHTML = '';
            
            if (!snapshot.exists()) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="no-data">
                            <i class="fas fa-info-circle"></i>
                            <span>لا توجد تقييمات</span>
                        </td>
                    </tr>
                `;
                return;
            }
            
            let index = 1;
            snapshot.forEach((childSnapshot) => {
                const evaluation = childSnapshot.val();
                const evalId = childSnapshot.key;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index}</td>
                    <td>${evaluation.studentName || 'غير محدد'}</td>
                    <td>${evaluation.evalType || 'غير محدد'}</td>
                    <td>${evaluation.evalDate || 'غير محدد'}</td>
                    <td>${evaluation.evalScore || 0}/100</td>
                    <td>
                        <button type="button" class="btn-icon delete" onclick="deleteEvaluation('${evalId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                tbody.appendChild(row);
                index++;
            });
        })
        .catch((error) => {
            console.error('Error loading evaluations:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>حدث خطأ في تحميل التقييمات</span>
                    </td>
                </tr>
            `;
        });
}

function setupSpecialistForms() {
    const addEvaluationForm = document.getElementById('addEvaluationForm');
    if (addEvaluationForm) {
        addEvaluationForm.addEventListener('submit', handleAddEvaluation);
        
        // تعيين تاريخ اليوم
        const today = new Date().toISOString().split('T')[0];
        const evalDateInput = document.getElementById('evalDate');
        if (evalDateInput) evalDateInput.value = today;
        
        // تحميل الأطفال في القائمة المنسدلة
        loadChildrenForEvaluationSelect();
    }
}

function loadChildrenForEvaluationSelect() {
    const select = document.getElementById('evalStudent');
    if (!select) return;
    
    select.innerHTML = '<option value="">اختر الطفل</option>';
    
    database.ref('student_specialists').orderByChild('specialistId').equalTo(currentUser.uid).once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) return;
            
            const studentIds = new Set();
            snapshot.forEach((child) => {
                studentIds.add(child.val().studentId);
            });
            
            studentIds.forEach((studentId) => {
                database.ref('students/' + studentId).once('value')
                    .then((studentSnapshot) => {
                        if (studentSnapshot.exists()) {
                            const student = studentSnapshot.val();
                            const option = document.createElement('option');
                            option.value = studentId;
                            option.textContent = student.fullName || 'طفل غير محدد';
                            select.appendChild(option);
                        }
                    });
            });
        });
}

function handleAddEvaluation(e) {
    e.preventDefault();
    
    const evaluationData = {
        studentId: document.getElementById('evalStudent').value,
        evalType: document.getElementById('evalType').value,
        evalDate: document.getElementById('evalDate').value,
        evalScore: parseInt(document.getElementById('evalScore').value),
        evalNotes: document.getElementById('evalNotes').value.trim(),
        specialistId: currentUser.uid,
        specialistName: currentUserData.fullName || 'الأخصائي',
        createdAt: new Date().toISOString()
    };
    
    // التحقق من البيانات
    if (!evaluationData.studentId || !evaluationData.evalType || !evaluationData.evalDate || 
        isNaN(evaluationData.evalScore) || evaluationData.evalScore < 0 || evaluationData.evalScore > 100) {
        showMessage('يرجى إدخال بيانات صحيحة', 'error');
        return;
    }
    
    showLoading();
    
    // الحصول على اسم الطالب
    database.ref('students/' + evaluationData.studentId).once('value')
        .then((studentSnapshot) => {
            if (!studentSnapshot.exists()) {
                throw new Error('الطفل غير موجود');
            }
            
            const student = studentSnapshot.val();
            evaluationData.studentName = student.fullName || 'غير محدد';
            
            return database.ref('evaluations').push().set(evaluationData);
        })
        .then(() => {
            showMessage('تم إضافة التقييم بنجاح', 'success');
            document.getElementById('addEvaluationForm').reset();
            loadSpecialistEvaluations();
            loadSpecialistChildren();
            hideLoading();
        })
        .catch((error) => {
            console.error('Error adding evaluation:', error);
            showMessage('حدث خطأ في إضافة التقييم', 'error');
            hideLoading();
        });
}

function addEvaluationForChild(studentId) {
    showSection('add-evaluation');
    
    const select = document.getElementById('evalStudent');
    if (select) {
        select.value = studentId;
    }
}

function deleteEvaluation(evalId) {
    if (confirm('هل أنت متأكد من حذف هذا التقييم؟')) {
        showLoading();
        database.ref('evaluations/' + evalId).remove()
            .then(() => {
                showMessage('تم حذف التقييم بنجاح', 'success');
                loadSpecialistEvaluations();
                hideLoading();
            })
            .catch((error) => {
                console.error('Error deleting evaluation:', error);
                showMessage('حدث خطأ في حذف التقييم', 'error');
                hideLoading();
            });
    }
}

// ============================================
// 11. تهيئة الصفحة عند التحميل
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'index.html':
        case '':
            initLoginPage();
            break;
        case 'admin.html':
            initAdminDashboard();
            break;
        case 'student.html':
            initStudentDashboard();
            break;
        case 'parent.html':
            initParentDashboard();
            break;
        case 'teacher.html':
            initTeacherDashboard();
            break;
        case 'specialist.html':
            initSpecialistDashboard();
            break;
    }
    
    // تحديث التاريخ الحالي
    const dateElements = document.querySelectorAll('#currentDate');
    if (dateElements.length > 0) {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('ar-EG', options);
        dateElements.forEach(el => { if (el) el.textContent = dateString; });
    }
});