// ========== 보안 및 유틸리티 함수 ==========

// Toast 컨테이너 확인 및 생성
function ensureToastContainer() {
    if (!document.getElementById('toastContainer')) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
}

// XSS 방지를 위한 HTML 이스케이프 함수
function sanitizeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 비밀번호 해싱
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hashed_' + Math.abs(hash).toString(36);
}

// 검증 함수
function validatePassword(password) {
    return password && password.length >= 8;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateUsername(username) {
    return username && username.length >= 3 && username.length <= 30;
}

// 날짜 포맷
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;

        return date.toLocaleDateString('ko-KR');
    } catch (e) {
        return '날짜 오류';
    }
}

// Toast 알림
function showToast(message) {
    try {
        ensureToastContainer();
        const container = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            background: #262626;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.15);
            pointer-events: auto;
            animation: slideIn 0.3s ease;
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    } catch (e) {
        console.error('Toast error:', e);
    }
}

// ========== 데이터 관리 (LocalStorage 기반) ==========
class DataManager {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        try {
            if (!localStorage.getItem('users')) {
                localStorage.setItem('users', JSON.stringify({}));
            }
            if (!localStorage.getItem('posts')) {
                localStorage.setItem('posts', JSON.stringify([]));
            }
            if (!localStorage.getItem('likes')) {
                localStorage.setItem('likes', JSON.stringify({}));
            }
            if (!localStorage.getItem('follows')) {
                localStorage.setItem('follows', JSON.stringify({}));
            }
            if (!localStorage.getItem('comments')) {
                localStorage.setItem('comments', JSON.stringify({}));
            }
            if (!localStorage.getItem('bookmarks')) {
                localStorage.setItem('bookmarks', JSON.stringify({}));
            }
        } catch (e) {
            console.error('Storage initialization error:', e);
        }
    }

    // 사용자 관리
    registerUser(email, password, username, fullname) {
        try {
            if (!validateEmail(email)) {
                return { success: false, message: '유효한 이메일을 입력하세요' };
            }
            if (!validatePassword(password)) {
                return { success: false, message: '비밀번호는 최소 8자 이상이어야 합니다' };
            }
            if (!validateUsername(username)) {
                return { success: false, message: '사용자명은 3-30자 사이여야 합니다' };
            }

            const users = JSON.parse(localStorage.getItem('users') || '{}');
            
            if (users[email]) {
                return { success: false, message: '이미 등록된 이메일입니다' };
            }

            for (const user of Object.values(users)) {
                if (user.username === username) {
                    return { success: false, message: '이미 사용 중인 사용자명입니다' };
                }
            }

            users[email] = {
                email,
                password: hashPassword(password),
                username,
                fullname: sanitizeHtml(fullname),
                bio: '',
                createdAt: new Date().toISOString()
            };
            localStorage.setItem('users', JSON.stringify(users));
            return { success: true };
        } catch (e) {
            console.error('Registration error:', e);
            return { success: false, message: '회원가입 중 오류가 발생했습니다' };
        }
    }

    loginUser(email, password) {
        try {
            if (!validateEmail(email)) {
                return { success: false, message: '유효한 이메일을 입력하세요' };
            }

            const users = JSON.parse(localStorage.getItem('users') || '{}');
            const user = users[email];
            
            if (!user || user.password !== hashPassword(password)) {
                return { success: false, message: '이메일 또는 비밀번호가 잘못되었습니다' };
            }
            
            return { success: true, user };
        } catch (e) {
            console.error('Login error:', e);
            return { success: false, message: '로그인 중 오류가 발생했습니다' };
        }
    }

    getUserInfo(email) {
        try {
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            return users[email] || null;
        } catch (e) {
            console.error('Get user info error:', e);
            return null;
        }
    }

    // 게시물 관리
    createPost(authorEmail, media, caption, location) {
        try {
            const posts = JSON.parse(localStorage.getItem('posts') || '[]');
            const post = {
                id: Date.now(),
                authorEmail,
                media,
                caption: sanitizeHtml(caption),
                location: sanitizeHtml(location),
                createdAt: new Date().toISOString(),
                likeCount: 0,
                comments: []
            };
            posts.unshift(post);
            localStorage.setItem('posts', JSON.stringify(posts));
            return post;
        } catch (e) {
            console.error('Create post error:', e);
            return null;
        }
    }

    getAllPosts() {
        try {
            return JSON.parse(localStorage.getItem('posts') || '[]');
        } catch (e) {
            console.error('Get all posts error:', e);
            return [];
        }
    }

    getUserPosts(email) {
        try {
            const posts = JSON.parse(localStorage.getItem('posts') || '[]');
            return posts.filter(post => post.authorEmail === email);
        } catch (e) {
            console.error('Get user posts error:', e);
            return [];
        }
    }

    getPost(postId) {
        try {
            const posts = JSON.parse(localStorage.getItem('posts') || '[]');
            return posts.find(post => post.id === postId);
        } catch (e) {
            console.error('Get post error:', e);
            return null;
        }
    }

    // 좋아요 관리
    toggleLike(userEmail, postId) {
        try {
            const likes = JSON.parse(localStorage.getItem('likes') || '{}');
            const key = `${userEmail}_${postId}`;
            
            if (!likes[key]) {
                likes[key] = true;
            } else {
                delete likes[key];
            }
            
            localStorage.setItem('likes', JSON.stringify(likes));
            return !!likes[key];
        } catch (e) {
            console.error('Toggle like error:', e);
            return false;
        }
    }

    isLiked(userEmail, postId) {
        try {
            const likes = JSON.parse(localStorage.getItem('likes') || '{}');
            return !!likes[`${userEmail}_${postId}`];
        } catch (e) {
            console.error('Is liked error:', e);
            return false;
        }
    }

    getLikedPosts(userEmail) {
        try {
            const likes = JSON.parse(localStorage.getItem('likes') || '{}');
            const likedPostIds = Object.keys(likes)
                .filter(key => key.startsWith(userEmail + '_'))
                .map(key => {
                    const parts = key.split('_');
                    return parseInt(parts[parts.length - 1]);
                });
            
            const posts = JSON.parse(localStorage.getItem('posts') || '[]');
            return posts.filter(post => likedPostIds.includes(post.id));
        } catch (e) {
            console.error('Get liked posts error:', e);
            return [];
        }
    }

    // 북마크 관리
    toggleBookmark(userEmail, postId) {
        try {
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
            const key = `${userEmail}_${postId}`;
            
            if (!bookmarks[key]) {
                bookmarks[key] = true;
            } else {
                delete bookmarks[key];
            }
            
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
            return !!bookmarks[key];
        } catch (e) {
            console.error('Toggle bookmark error:', e);
            return false;
        }
    }

    isBookmarked(userEmail, postId) {
        try {
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
            return !!bookmarks[`${userEmail}_${postId}`];
        } catch (e) {
            console.error('Is bookmarked error:', e);
            return false;
        }
    }

    getBookmarkedPosts(userEmail) {
        try {
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '{}');
            const bookmarkedPostIds = Object.keys(bookmarks)
                .filter(key => key.startsWith(userEmail + '_'))
                .map(key => {
                    const parts = key.split('_');
                    return parseInt(parts[parts.length - 1]);
                });
            
            const posts = JSON.parse(localStorage.getItem('posts') || '[]');
            return posts.filter(post => bookmarkedPostIds.includes(post.id));
        } catch (e) {
            console.error('Get bookmarked posts error:', e);
            return [];
        }
    }

    // 팔로우 관리
    toggleFollow(userEmail, targetEmail) {
        try {
            const follows = JSON.parse(localStorage.getItem('follows') || '{}');
            const key = `${userEmail}_${targetEmail}`;
            
            if (!follows[key]) {
                follows[key] = true;
            } else {
                delete follows[key];
            }
            
            localStorage.setItem('follows', JSON.stringify(follows));
            return !!follows[key];
        } catch (e) {
            console.error('Toggle follow error:', e);
            return false;
        }
    }

    isFollowing(userEmail, targetEmail) {
        try {
            const follows = JSON.parse(localStorage.getItem('follows') || '{}');
            return !!follows[`${userEmail}_${targetEmail}`];
        } catch (e) {
            console.error('Is following error:', e);
            return false;
        }
    }

    getFollowing(userEmail) {
        try {
            const follows = JSON.parse(localStorage.getItem('follows') || '{}');
            return Object.keys(follows)
                .filter(key => key.startsWith(userEmail + '_'))
                .map(key => key.split('_')[1]);
        } catch (e) {
            console.error('Get following error:', e);
            return [];
        }
    }

    // 댓글 관리
    addComment(postId, userEmail, text) {
        try {
            if (!text || text.trim().length === 0) {
                return null;
            }

            const comments = JSON.parse(localStorage.getItem('comments') || '{}');
            const postKey = postId.toString();
            
            if (!comments[postKey]) {
                comments[postKey] = [];
            }
            
            const comment = {
                id: Date.now(),
                userEmail,
                text: sanitizeHtml(text),
                createdAt: new Date().toISOString()
            };
            
            comments[postKey].push(comment);
            localStorage.setItem('comments', JSON.stringify(comments));
            return comment;
        } catch (e) {
            console.error('Add comment error:', e);
            return null;
        }
    }

    getComments(postId) {
        try {
            const comments = JSON.parse(localStorage.getItem('comments') || '{}');
            return comments[postId.toString()] || [];
        } catch (e) {
            console.error('Get comments error:', e);
            return [];
        }
    }
}

// ========== 전역 변수 ==========
const dataManager = new DataManager();
let currentUser = null;
let currentPost = null;
let currentMediaIndex = 0;
let uploadedFiles = [];

// ========== 인증 함수 ==========
function setupAuthListeners() {
    const toggleSignupBtn = document.getElementById('toggleSignup');
    const toggleLoginBtn = document.getElementById('toggleLogin');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (toggleSignupBtn) {
        toggleSignupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginCard').style.display = 'none';
            document.getElementById('signupCard').style.display = 'block';
            toggleSignupBtn.style.display = 'none';
            toggleLoginBtn.style.display = 'block';
        });
    }

    if (toggleLoginBtn) {
        toggleLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginCard').style.display = 'block';
            document.getElementById('signupCard').style.display = 'none';
            toggleSignupBtn.style.display = 'block';
            toggleLoginBtn.style.display = 'none';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            const result = dataManager.loginUser(email, password);
            if (result.success) {
                currentUser = result.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                showMainApp();
                loadFeed();
                showToast('로그인되었습니다!');
            } else {
                showToast(result.message);
            }
            loginForm.reset();
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value.trim();
            const username = document.getElementById('signupUsername').value.trim();
            const fullname = document.getElementById('signupFullname').value.trim();
            const password = document.getElementById('signupPassword').value;

            const result = dataManager.registerUser(email, password, username, fullname);
            if (result.success) {
                showToast('회원가입이 완료되었습니다!');
                document.getElementById('loginCard').style.display = 'block';
                document.getElementById('signupCard').style.display = 'none';
                toggleSignupBtn.style.display = 'block';
                loginForm.reset();
                toggleLoginBtn.style.display = 'none';
                signupForm.reset();
            } else {
                showToast(result.message);
            }
        });
    }
}

// ========== UI 함수 ==========
function showMainApp() {
    try {
        document.getElementById('authScreen').classList.remove('is-active');
        document.getElementById('mainApp').style.display = 'flex';
        updateHeader();
        setupMainAppListeners();
    } catch (e) {
        console.error('Show main app error:', e);
    }
}

function hideMainApp() {
    try {
        document.getElementById('authScreen').classList.add('is-active');
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginForm').reset();
        document.getElementById('signupForm').reset();
        currentUser = null;
        localStorage.removeItem('currentUser');
        showToast('로그아웃되었습니다');
    } catch (e) {
        console.error('Hide main app error:', e);
    }
}

function updateHeader() {
    try {
        if (currentUser) {
            const initial = currentUser.username.charAt(0).toUpperCase();
            const headerAvatar = document.getElementById('headerAvatar');
            if (headerAvatar) {
                headerAvatar.textContent = initial;
            }
        }
    } catch (e) {
        console.error('Update header error:', e);
    }
}

function switchSection(sectionName) {
    try {
        document.querySelectorAll('.section').forEach(sec => {
            sec.style.display = 'none';
        });
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('is-active');
        });

        const section = document.getElementById(sectionName + 'Section');
        if (section) {
            section.style.display = 'block';
        }

        const activeButton = document.querySelector(`.nav-item[data-section="${sectionName}"]`);
        if (activeButton) {
            activeButton.classList.add('is-active');
        }

        if (sectionName === 'profile') {
            loadProfile();
        } else if (sectionName === 'explore') {
            loadExplore();
        } else if (sectionName === 'likes') {
            loadLikesSection();
        } else if (sectionName === 'bookmarks') {
            loadBookmarksSection();
        } else if (sectionName === 'reels') {
            loadReels();
        } else if (sectionName === 'messages') {
            loadMessages();
        } else if (sectionName === 'home') {
            loadFeed();
        } else if (sectionName === 'upload') {
            // 업로드 섹션 초기화
            uploadedFiles = [];
            document.getElementById('uploadForm').reset();
            document.getElementById('uploadPreview').innerHTML = '';
        }
    } catch (e) {
        console.error('Switch section error:', e);
        showToast('섹션 전환 중 오류가 발생했습니다');
    }
}

// ========== 피드 함수 ==========
function loadFeed() {
    try {
        const posts = dataManager.getAllPosts();
        const feedContainer = document.getElementById('feedContainer');
        
        if (!feedContainer) return;
        
        feedContainer.innerHTML = '';

        if (posts.length === 0) {
            feedContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #65676b;">아직 게시물이 없습니다. 새 게시물을 만들어보세요!</p>';
            return;
        }

        posts.forEach(post => {
            const author = dataManager.getUserInfo(post.authorEmail);
            if (!author) return;

            const likeCount = calculateLikeCount(post.id);
            const isLiked = dataManager.isLiked(currentUser.email, post.id);

            const postElement = document.createElement('div');
            postElement.className = 'post-card';
            
            const mediaHtml = post.media.map(m => {
                if (m.type === 'image') {
                    return `<img src="${m.data}" alt="Post" style="width: 100%; max-height: 500px; object-fit: cover;">`;
                } else {
                    return `<video controls style="width: 100%; max-height: 500px; object-fit: cover;">
                        <source src="${m.data}" type="video/mp4">
                    </video>`;
                }
            }).join('');

            postElement.innerHTML = `
                <div class="post-card-header">
                    <div class="post-author">
                        <div class="avatar">${sanitizeHtml(author.username.charAt(0).toUpperCase())}</div>
                        <div class="post-author-info">
                            <strong>${sanitizeHtml(author.username)}</strong>
                            <p class="location">${sanitizeHtml(post.location || '위치 없음')}</p>
                        </div>
                    </div>
                    <button class="post-menu" title="더보기">⋮</button>
                </div>
                <div class="post-image">${mediaHtml}</div>
                <div class="post-actions-bar">
                    <button class="post-action-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                    <button class="post-action-btn" onclick="openPost(${post.id})">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </button>
                    <button class="post-action-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </button>
                </div>
                <div class="post-info">
                    <div class="like-count">${likeCount}명이 좋아합니다</div>
                    <div class="post-caption">
                        <strong>${sanitizeHtml(author.username)}</strong>
                        <span class="caption-text">${sanitizeHtml(post.caption)}</span>
                    </div>
                    <span class="comments-count">댓글 ${dataManager.getComments(post.id).length}개</span>
                    <span class="post-date">${formatDate(post.createdAt)}</span>
                </div>
            `;
            feedContainer.appendChild(postElement);
        });
    } catch (e) {
        console.error('Load feed error:', e);
        showToast('피드를 불러오는 중 오류가 발생했습니다');
    }
}

function calculateLikeCount(postId) {
    try {
        const likes = JSON.parse(localStorage.getItem('likes') || '{}');
        return Object.keys(likes).filter(key => key.endsWith('_' + postId)).length;
    } catch (e) {
        console.error('Calculate like count error:', e);
        return 0;
    }
}

function toggleLike(postId) {
    try {
        if (!currentUser) return;
        dataManager.toggleLike(currentUser.email, postId);
        loadFeed();
        if (currentPost && currentPost.id === postId) {
            openPost(postId);
        }
    } catch (e) {
        console.error('Toggle like error:', e);
    }
}

function openPost(postId) {
    try {
        currentPost = dataManager.getPost(postId);
        if (!currentPost) return;

        const author = dataManager.getUserInfo(currentPost.authorEmail);
        if (!author) return;

        const isLiked = dataManager.isLiked(currentUser.email, postId);
        const isBookmarked = dataManager.isBookmarked(currentUser.email, postId);
        const comments = dataManager.getComments(postId);
        const likeCount = calculateLikeCount(postId);
        currentMediaIndex = 0;

        // 미디어 표시
        const media = currentPost.media[currentMediaIndex];
        const mediaDisplay = document.getElementById('detailImage');
        if (media.type === 'image') {
            mediaDisplay.innerHTML = `<img src="${media.data}" alt="Post">`;
        } else {
            mediaDisplay.innerHTML = `<video controls style="width: 100%; height: 100%;"><source src="${media.data}" type="video/mp4"></video>`;
        }

        // 미디어 카운트
        document.getElementById('mediaCount').textContent = `${currentMediaIndex + 1} / ${currentPost.media.length}`;

        // 미디어 네비게이션
        const prevBtn = document.getElementById('prevMediaBtn');
        const nextBtn = document.getElementById('nextMediaBtn');
        
        if (currentPost.media.length > 1) {
            prevBtn.style.display = 'inline-block';
            nextBtn.style.display = 'inline-block';
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }

        // 작성자 정보
        document.getElementById('detailAuthorAvatar').textContent = author.username.charAt(0).toUpperCase();
        document.getElementById('detailAuthorName').textContent = sanitizeHtml(author.username);
        document.getElementById('detailLocation').textContent = sanitizeHtml(currentPost.location || '위치 없음');

        // 좋아요 버튼
        const likeBtn = document.getElementById('detailLikeBtn');
        likeBtn.classList.toggle('liked', isLiked);

        // 북마크 버튼
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        bookmarkBtn.classList.toggle('saved', isBookmarked);

        // 좋아요 수
        document.getElementById('detailLikeCount').textContent = likeCount + (likeCount === 1 ? '명이 좋아합니다' : '명이 좋아합니다');

        // 날짜
        document.getElementById('postDate').textContent = formatDate(currentPost.createdAt);

        // 댓글
        const commentsSection = document.getElementById('postComments');
        commentsSection.innerHTML = '';

        if (currentPost.caption) {
            const captionEl = document.createElement('div');
            captionEl.className = 'comment-item';
            captionEl.innerHTML = `<strong>${sanitizeHtml(author.username)}</strong> ${sanitizeHtml(currentPost.caption)}`;
            commentsSection.appendChild(captionEl);
        }

        comments.forEach(comment => {
            const commentAuthor = dataManager.getUserInfo(comment.userEmail);
            if (commentAuthor) {
                const commentEl = document.createElement('div');
                commentEl.className = 'comment-item';
                commentEl.innerHTML = `<strong>${sanitizeHtml(commentAuthor.username)}</strong> ${sanitizeHtml(comment.text)}`;
                commentsSection.appendChild(commentEl);
            }
        });

        // 모달 열기
        const modal = document.getElementById('postModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    } catch (e) {
        console.error('Open post error:', e);
        showToast('게시물을 불러오는 중 오류가 발생했습니다');
    }
}

function closeModal() {
    try {
        const modal = document.getElementById('postModal');
        if (modal) {
            modal.style.display = 'none';
        }
        currentPost = null;
    } catch (e) {
        console.error('Close modal error:', e);
    }
}

// ========== 댓글 함수 ==========
function setupCommentForm() {
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!currentPost) return;

            const commentInput = document.getElementById('commentInput');
            const text = commentInput.value.trim();

            if (!text) {
                showToast('댓글을 입력하세요');
                return;
            }

            dataManager.addComment(currentPost.id, currentUser.email, text);
            commentInput.value = '';
            openPost(currentPost.id);
            showToast('댓글이 등록되었습니다');
        });
    }
}

// ========== 업로드 함수 ==========
function setupUploadForm() {
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const uploadDropzone = document.querySelector('.upload-dropzone');

    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();

            if (uploadedFiles.length === 0) {
                showToast('사진이나 동영상을 업로드하세요');
                return;
            }

            const caption = document.getElementById('postCaption').value.trim();
            const location = document.getElementById('postLocation').value.trim();

            dataManager.createPost(currentUser.email, uploadedFiles, caption, location);

            uploadForm.reset();
            document.getElementById('uploadPreview').innerHTML = '';
            uploadedFiles = [];

            showToast('게시물이 업로드되었습니다!');
            switchSection('home');
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            uploadedFiles = [];

            Array.from(files).forEach(file => {
                if (file.size > 100 * 1024 * 1024) {
                    showToast('파일이 너무 큽니다 (최대 100MB)');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedFiles.push({
                        type: file.type.startsWith('image') ? 'image' : 'video',
                        data: event.target.result
                    });
                    updatePreview();
                };
                reader.onerror = () => {
                    showToast('파일 읽기 중 오류가 발생했습니다');
                };
                reader.readAsDataURL(file);
            });
        });
    }

    if (uploadDropzone) {
        uploadDropzone.addEventListener('click', () => {
            fileInput.click();
        });

        uploadDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadDropzone.style.borderColor = 'var(--primary)';
        });

        uploadDropzone.addEventListener('dragleave', () => {
            uploadDropzone.style.borderColor = 'var(--border)';
        });

        uploadDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadDropzone.style.borderColor = 'var(--border)';
            fileInput.files = e.dataTransfer.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }
}

function updatePreview() {
    const preview = document.getElementById('uploadPreview');
    preview.innerHTML = '';

    uploadedFiles.forEach((file, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        if (file.type === 'image') {
            div.innerHTML = `<img src="${file.data}" alt="Preview">`;
        } else {
            div.innerHTML = `<video><source src="${file.data}" type="video/mp4"></video>`;
        }
        preview.appendChild(div);
    });
}

// ========== 프로필 함수 ==========
function loadProfile() {
    try {
        const userEmail = currentUser.email;
        const userInfo = dataManager.getUserInfo(userEmail);
        if (!userInfo) return;

        const userPosts = dataManager.getUserPosts(userEmail);
        const likedPosts = dataManager.getLikedPosts(userEmail);
        const bookmarkedPosts = dataManager.getBookmarkedPosts(userEmail);
        const following = dataManager.getFollowing(userEmail);

        document.getElementById('profileUsername').textContent = sanitizeHtml(userInfo.username);
        document.getElementById('profileBio').textContent = sanitizeHtml(userInfo.fullname || '');
        document.getElementById('profilePostCount').textContent = userPosts.length;
        document.getElementById('profileFollowerCount').textContent = 0;
        document.getElementById('profileFollowingCount').textContent = following.length;
        document.getElementById('profileAvatar').textContent = userInfo.username.charAt(0).toUpperCase();

        // 게시물
        const postsGrid = document.getElementById('profilePosts');
        postsGrid.innerHTML = '';
        userPosts.forEach(post => {
            const div = document.createElement('div');
            div.className = 'explore-item';
            const media = post.media[0];
            if (media.type === 'image') {
                div.innerHTML = `<img src="${media.data}" alt="Post" onclick="openPost(${post.id})">`;
            } else {
                div.innerHTML = `<video onclick="openPost(${post.id})"><source src="${media.data}" type="video/mp4"></video>`;
            }
            postsGrid.appendChild(div);
        });

        // 좋아요한 게시물
        const likesGrid = document.getElementById('profileLikes');
        likesGrid.innerHTML = '';
        likedPosts.forEach(post => {
            const div = document.createElement('div');
            div.className = 'explore-item';
            const media = post.media[0];
            if (media.type === 'image') {
                div.innerHTML = `<img src="${media.data}" alt="Post" onclick="openPost(${post.id})">`;
            } else {
                div.innerHTML = `<video onclick="openPost(${post.id})"><source src="${media.data}" type="video/mp4"></video>`;
            }
            likesGrid.appendChild(div);
        });

        // 북마크한 게시물
        const bookmarksGrid = document.getElementById('profileBookmarks');
        bookmarksGrid.innerHTML = '';
        bookmarkedPosts.forEach(post => {
            const div = document.createElement('div');
            div.className = 'explore-item';
            const media = post.media[0];
            if (media.type === 'image') {
                div.innerHTML = `<img src="${media.data}" alt="Post" onclick="openPost(${post.id})">`;
            } else {
                div.innerHTML = `<video onclick="openPost(${post.id})"><source src="${media.data}" type="video/mp4"></video>`;
            }
            bookmarksGrid.appendChild(div);
        });

        // 팔로잉
        const followingList = document.getElementById('profileFollowing');
        followingList.innerHTML = '';
        following.forEach(email => {
            const user = dataManager.getUserInfo(email);
            if (user) {
                const div = document.createElement('div');
                div.className = 'following-item';
                div.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="avatar">${user.username.charAt(0).toUpperCase()}</div>
                        <div>
                            <strong>${sanitizeHtml(user.username)}</strong>
                            <p style="margin: 0; font-size: 12px; color: #65676b;">${sanitizeHtml(user.fullname)}</p>
                        </div>
                    </div>
                    <button onclick="unfollowUser('${email}')" style="border: none; background: white; color: #ed4956; cursor: pointer; font-weight: 600; font-size: 12px;">언팔로우</button>
                `;
                followingList.appendChild(div);
            }
        });
    } catch (e) {
        console.error('Load profile error:', e);
        showToast('프로필을 불러오는 중 오류가 발생했습니다');
    }
}

function unfollowUser(email) {
    try {
        dataManager.toggleFollow(currentUser.email, email);
        loadProfile();
        showToast('언팔로우했습니다');
    } catch (e) {
        console.error('Unfollow error:', e);
    }
}

// ========== 탐색 함수 ==========
function loadExplore() {
    try {
        const posts = dataManager.getAllPosts();
        const exploreGrid = document.getElementById('exploreGrid');
        
        if (!exploreGrid) return;
        
        exploreGrid.innerHTML = '';

        if (posts.length === 0) {
            exploreGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #65676b;">게시물이 없습니다</p>';
            return;
        }

        posts.forEach(post => {
            const div = document.createElement('div');
            div.className = 'explore-item';
            const media = post.media[0];
            if (media.type === 'image') {
                div.innerHTML = `<img src="${media.data}" alt="Post" onclick="openPost(${post.id})">`;
            } else {
                div.innerHTML = `<video onclick="openPost(${post.id})"><source src="${media.data}" type="video/mp4"></video>`;
            }
            exploreGrid.appendChild(div);
        });
    } catch (e) {
        console.error('Load explore error:', e);
    }
}

// ========== 좋아요 섹션 ==========
function loadLikesSection() {
    try {
        const likedPosts = dataManager.getLikedPosts(currentUser.email);
        const likesList = document.getElementById('likesList');
        
        if (!likesList) return;
        
        likesList.innerHTML = '';

        if (likedPosts.length === 0) {
            likesList.innerHTML = '<p style="text-align: center; padding: 40px; color: #65676b;">좋아요한 게시물이 없습니다</p>';
            return;
        }

        likedPosts.forEach(post => {
            const author = dataManager.getUserInfo(post.authorEmail);
            if (!author) return;

            const postElement = document.createElement('div');
            postElement.className = 'post-card';
            
            const mediaHtml = post.media.map(m => {
                if (m.type === 'image') {
                    return `<img src="${m.data}" alt="Post" style="width: 100%; max-height: 500px; object-fit: cover;">`;
                } else {
                    return `<video controls style="width: 100%; max-height: 500px; object-fit: cover;">
                        <source src="${m.data}" type="video/mp4">
                    </video>`;
                }
            }).join('');

            const isLiked = true;
            const likeCount = calculateLikeCount(post.id);

            postElement.innerHTML = `
                <div class="post-card-header">
                    <div class="post-author">
                        <div class="avatar">${author.username.charAt(0).toUpperCase()}</div>
                        <div class="post-author-info">
                            <strong>${sanitizeHtml(author.username)}</strong>
                            <p class="location">${sanitizeHtml(post.location || '위치 없음')}</p>
                        </div>
                    </div>
                    <button class="post-menu">⋮</button>
                </div>
                <div class="post-image">${mediaHtml}</div>
                <div class="post-actions-bar">
                    <button class="post-action-btn liked" onclick="toggleLike(${post.id})">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="post-info">
                    <div class="like-count">${likeCount}명이 좋아합니다</div>
                </div>
            `;
            likesList.appendChild(postElement);
        });
    } catch (e) {
        console.error('Load likes section error:', e);
    }
}

// ========== 북마크 섹션 ==========
function loadBookmarksSection() {
    try {
        const bookmarkedPosts = dataManager.getBookmarkedPosts(currentUser.email);
        const bookmarksList = document.getElementById('bookmarksList');
        
        if (!bookmarksList) return;
        
        bookmarksList.innerHTML = '';

        if (bookmarkedPosts.length === 0) {
            bookmarksList.innerHTML = '<p style="text-align: center; padding: 40px; color: #65676b;">북마크한 게시물이 없습니다</p>';
            return;
        }

        bookmarkedPosts.forEach(post => {
            const author = dataManager.getUserInfo(post.authorEmail);
            if (!author) return;

            const postElement = document.createElement('div');
            postElement.className = 'post-card';
            
            const mediaHtml = post.media.map(m => {
                if (m.type === 'image') {
                    return `<img src="${m.data}" alt="Post" style="width: 100%; max-height: 500px; object-fit: cover;">`;
                } else {
                    return `<video controls style="width: 100%; max-height: 500px; object-fit: cover;">
                        <source src="${m.data}" type="video/mp4">
                    </video>`;
                }
            }).join('');

            postElement.innerHTML = `
                <div class="post-card-header">
                    <div class="post-author">
                        <div class="avatar">${author.username.charAt(0).toUpperCase()}</div>
                        <div class="post-author-info">
                            <strong>${sanitizeHtml(author.username)}</strong>
                            <p class="location">${sanitizeHtml(post.location || '위치 없음')}</p>
                        </div>
                    </div>
                </div>
                <div class="post-image">${mediaHtml}</div>
            `;
            bookmarksList.appendChild(postElement);
        });
    } catch (e) {
        console.error('Load bookmarks section error:', e);
    }
}

// ========== 릴스 함수 ==========
function loadReels() {
    try {
        const reelsList = document.getElementById('reelsList');
        if (reelsList) {
            reelsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #65676b;">릴스는 곧 오픈됩니다</p>';
        }
    } catch (e) {
        console.error('Load reels error:', e);
    }
}

// ========== 메시지 함수 ==========
function loadMessages() {
    try {
        const messagesList = document.getElementById('messagesList');
        if (messagesList) {
            messagesList.innerHTML = '<p style="text-align: center; padding: 40px; color: #65676b;">메시지는 곧 오픈됩니다</p>';
        }
    } catch (e) {
        console.error('Load messages error:', e);
    }
}

// ========== 네비게이션 ==========
function setupNavigation() {
    try {
        // 사이드바 네비게이션
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = item.dataset.section;
                if (section) {
                    switchSection(section);
                }
            });
        });

        // 프로필 탭
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('is-active'));
                btn.classList.add('is-active');

                const tab = btn.dataset.tab;
                document.getElementById('profilePosts').style.display = 'none';
                document.getElementById('profileLikes').style.display = 'none';
                document.getElementById('profileBookmarks').style.display = 'none';
                document.getElementById('profileFollowing').style.display = 'none';

                if (tab === 'posts') {
                    document.getElementById('profilePosts').style.display = 'grid';
                } else if (tab === 'likes') {
                    document.getElementById('profileLikes').style.display = 'grid';
                } else if (tab === 'bookmarks') {
                    document.getElementById('profileBookmarks').style.display = 'grid';
                } else if (tab === 'following') {
                    document.getElementById('profileFollowing').style.display = 'block';
                }
            });
        });

        // 헤더 버튼들
        const exploreHeaderBtn = document.getElementById('exploreHeaderBtn');
        if (exploreHeaderBtn) {
            exploreHeaderBtn.addEventListener('click', () => switchSection('explore'));
        }

        const likesHeaderBtn = document.getElementById('likesHeaderBtn');
        if (likesHeaderBtn) {
            likesHeaderBtn.addEventListener('click', () => switchSection('likes'));
        }

        const messagesHeaderBtn = document.getElementById('messagesHeaderBtn');
        if (messagesHeaderBtn) {
            messagesHeaderBtn.addEventListener('click', () => switchSection('messages'));
        }
    } catch (e) {
        console.error('Setup navigation error:', e);
    }
}

// ========== 모달 함수 ==========
function setupModalListeners() {
    try {
        const detailLikeBtn = document.getElementById('detailLikeBtn');
        if (detailLikeBtn) {
            detailLikeBtn.addEventListener('click', () => {
                if (!currentPost) return;
                toggleLike(currentPost.id);
            });
        }

        const bookmarkBtn = document.getElementById('bookmarkBtn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', () => {
                if (!currentPost) return;
                dataManager.toggleBookmark(currentUser.email, currentPost.id);
                const isBookmarked = dataManager.isBookmarked(currentUser.email, currentPost.id);
                bookmarkBtn.classList.toggle('saved', isBookmarked);
                showToast(isBookmarked ? '북마크하였습니다' : '북마크가 취소되었습니다');
            });
        }

        const prevMediaBtn = document.getElementById('prevMediaBtn');
        if (prevMediaBtn) {
            prevMediaBtn.addEventListener('click', () => {
                if (!currentPost || currentPost.media.length === 0) return;
                currentMediaIndex = (currentMediaIndex - 1 + currentPost.media.length) % currentPost.media.length;
                const media = currentPost.media[currentMediaIndex];
                const mediaDisplay = document.getElementById('detailImage');
                if (media.type === 'image') {
                    mediaDisplay.innerHTML = `<img src="${media.data}" alt="Post">`;
                } else {
                    mediaDisplay.innerHTML = `<video controls style="width: 100%; height: 100%;"><source src="${media.data}" type="video/mp4"></video>`;
                }
                document.getElementById('mediaCount').textContent = `${currentMediaIndex + 1} / ${currentPost.media.length}`;
            });
        }

        const nextMediaBtn = document.getElementById('nextMediaBtn');
        if (nextMediaBtn) {
            nextMediaBtn.addEventListener('click', () => {
                if (!currentPost || currentPost.media.length === 0) return;
                currentMediaIndex = (currentMediaIndex + 1) % currentPost.media.length;
                const media = currentPost.media[currentMediaIndex];
                const mediaDisplay = document.getElementById('detailImage');
                if (media.type === 'image') {
                    mediaDisplay.innerHTML = `<img src="${media.data}" alt="Post">`;
                } else {
                    mediaDisplay.innerHTML = `<video controls style="width: 100%; height: 100%;"><source src="${media.data}" type="video/mp4"></video>`;
                }
                document.getElementById('mediaCount').textContent = `${currentMediaIndex + 1} / ${currentPost.media.length}`;
            });
        }

        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }

        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', closeModal);
        }

        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('postModal');
            if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
                closeModal();
            }
        });
    } catch (e) {
        console.error('Setup modal listeners error:', e);
    }
}

// ========== 헤더 메뉴 ==========
function setupHeaderMenu() {
    try {
        const profileBtn = document.getElementById('profileBtn');
        const dropdownMenu = document.querySelector('.dropdown-menu');

        if (profileBtn && dropdownMenu) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
            });

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.user-menu')) {
                    dropdownMenu.style.display = 'none';
                }
            });

            const logoutLink = document.querySelector('[data-action="logout"]');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    hideMainApp();
                });
            }

            const profileLink = document.querySelector('[data-action="go-profile"]');
            if (profileLink) {
                profileLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    switchSection('profile');
                    dropdownMenu.style.display = 'none';
                });
            }
        }
    } catch (e) {
        console.error('Setup header menu error:', e);
    }
}

// ========== 메인 앱 리스너 설정 ==========
function setupMainAppListeners() {
    try {
        setupNavigation();
        setupUploadForm();
        setupCommentForm();
        setupModalListeners();
        setupHeaderMenu();
    } catch (e) {
        console.error('Setup main app listeners error:', e);
    }
}

// ========== 초기화 ==========
document.addEventListener('DOMContentLoaded', () => {
    try {
        ensureToastContainer();
        setupAuthListeners();
        
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                currentUser = JSON.parse(savedUser);
                showMainApp();
                loadFeed();
            } catch (e) {
                console.error('Parse saved user error:', e);
                localStorage.removeItem('currentUser');
            }
        }
    } catch (e) {
        console.error('Initialization error:', e);
    }
});
