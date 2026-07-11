import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useNotifications } from './hooks/useNotifications'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import PostBook from './pages/PostBook'
import BookDetail from './pages/BookDetail'
import Chat from './pages/Chat'
import Inbox from './pages/Inbox'
import Profile from './pages/Profile'
import ReportUser from './pages/ReportUser'
import BlockUser from './pages/BlockUser'
import RateUser from './pages/RateUser'
import BottomNav from './components/BottomNav'

// Screens that show the bottom nav
const NAV_SCREENS = ['home', 'inbox', 'profile']

function AppContent() {
  const { user, loading } = useAuth()
  const { unreadCount, notifications, markAllRead } = useNotifications(user?.id)
  const [showSplash, setShowSplash] = useState(true)
  const [authView, setAuthView] = useState('login')
  const [screen, setScreen] = useState('home')
  const [previousScreen, setPreviousScreen] = useState('home')

  const [selectedBook, setSelectedBook] = useState(null)
  const [editingBook, setEditingBook] = useState(null)
  const [chatBook, setChatBook] = useState(null)
  const [chatConversation, setChatConversation] = useState(null)
  const [targetUser, setTargetUser] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (showSplash || loading) return <Splash />

  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup onSwitchToLogin={() => setAuthView('login')} />
    )
  }

  function goTo(next) {
    setPreviousScreen(screen)
    setScreen(next)
  }

  function handleNavigation(key) {
    if (key === 'post') {
      goTo('post')
    } else if (key === 'inbox') {
      markAllRead()
      setScreen('inbox')
    } else {
      setScreen(key)
    }
  }

  function openBook(book) {
    setSelectedBook(book)
    goTo('detail')
  }

  function openChat(book) {
    setChatBook(book)
    setChatConversation(null)
    goTo('chat')
  }

  function openConversation(conv) {
    setChatConversation(conv)
    setChatBook(conv.book)
    markAllRead()
    goTo('chat')
  }

  function openReport(profileObj) {
    setTargetUser(profileObj)
    goTo('report')
  }

  function openBlock(profileObj) {
    setTargetUser(profileObj)
    goTo('block')
  }

  function openRate(profileObj) {
    setTargetUser(profileObj)
    goTo('rate')
  }

  // Determine the active bottom-nav tab
  const navTab = NAV_SCREENS.includes(screen) ? screen : null

  return (
    <div className="relative">
      {/* ── SCREENS ── */}
      {screen === 'post' && (
        <PostBook
          onBack={() => setScreen('home')}
          onPosted={() => setScreen('home')}
        />
      )}

      {screen === 'edit' && editingBook && (
        <PostBook
          editBook={editingBook}
          onBack={() => setScreen('detail')}
          onPosted={() => { setEditingBook(null); setScreen('home') }}
        />
      )}

      {screen === 'detail' && selectedBook && (
        <BookDetail
          book={selectedBook}
          onBack={() => setScreen('home')}
          onChat={openChat}
          onReport={(book) => openReport({ id: book.seller_id, full_name: book.profiles?.full_name })}
          onEdit={(book) => { setEditingBook(book); setScreen('edit') }}
          onRemoved={() => setScreen('home')}
        />
      )}

      {screen === 'chat' && (chatBook || chatConversation) && (
        <Chat
          book={chatBook}
          existingConversation={chatConversation}
          onBack={() => {
            setChatBook(null)
            setChatConversation(null)
            setScreen(chatConversation ? 'inbox' : 'detail')
          }}
          onReportUser={openReport}
          onBlockUser={openBlock}
          onRateUser={openRate}
          onMarkRead={markAllRead}
        />
      )}

      {screen === 'report' && targetUser && (
        <ReportUser
          reportedUserId={targetUser.id}
          reportedUserName={targetUser.full_name}
          onBack={() => setScreen(previousScreen)}
          onSubmitted={() => setScreen('home')}
        />
      )}

      {screen === 'block' && targetUser && (
        <BlockUser
          blockedUserId={targetUser.id}
          blockedUserName={targetUser.full_name}
          onBack={() => setScreen(previousScreen)}
          onBlocked={() => setScreen('home')}
        />
      )}

      {screen === 'rate' && targetUser && (
        <RateUser
          book={chatBook || selectedBook}
          ratedUserId={targetUser.id}
          ratedUserName={targetUser.full_name}
          onBack={() => setScreen(previousScreen)}
          onSubmitted={() => setScreen('home')}
        />
      )}

      {/* Screens that always render but hide behind others via display */}
      <div className={screen === 'home' ? 'block' : 'hidden'}>
        <Home
          isActive={screen === 'home'}
          onOpenPost={() => goTo('post')}
          onOpenBook={openBook}
          onOpenInbox={() => setScreen('inbox')}
          unreadCount={unreadCount}
          notifications={notifications}
          onMarkRead={markAllRead}
        />
      </div>

      <div className={screen === 'inbox' ? 'block' : 'hidden'}>
        <Inbox
          isActive={screen === 'inbox'}
          onBack={() => setScreen('home')}
          onOpenConversation={openConversation}
          onMarkRead={markAllRead}
        />
      </div>

      <div className={screen === 'profile' ? 'block' : 'hidden'}>
        <Profile
          isActive={screen === 'profile'}
          onBack={() => setScreen('home')}
          onOpenBook={openBook}
          onEditBook={(book) => { setEditingBook(book); goTo('edit') }}
        />
      </div>

      {/* Bottom nav — only on main screens */}
      {NAV_SCREENS.includes(screen) && (
        <BottomNav
          active={navTab}
          onNavigate={handleNavigation}
          unreadCount={unreadCount}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
