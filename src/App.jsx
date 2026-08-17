import { useState, useEffect, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useNotifications } from './hooks/useNotifications'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import BottomNav from './components/BottomNav'
import InstallPrompt from './components/InstallPrompt'

const PostBook = lazy(() => import('./pages/PostBook'))
const BookDetail = lazy(() => import('./pages/BookDetail'))
const Chat = lazy(() => import('./pages/Chat'))
const Inbox = lazy(() => import('./pages/Inbox'))
const Profile = lazy(() => import('./pages/Profile'))
const MyListings = lazy(() => import('./pages/MyListings'))
const ReportUser = lazy(() => import('./pages/ReportUser'))
const BlockUser = lazy(() => import('./pages/BlockUser'))
const RateUser = lazy(() => import('./pages/RateUser'))

const NAV_SCREENS = ['home', 'inbox', 'mylistings', 'profile']

function AppContent() {
  const { user, loading } = useAuth()
  const { unreadCount, notifications, markAllRead } = useNotifications(user?.id)
  const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('ssl_onboarded'))
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

  if (showOnboarding && !user) {
    return (
      <Onboarding onDone={() => {
        localStorage.setItem('ssl_onboarded', 'true')
        setShowOnboarding(false)
      }} />
    )
  }

  if (!user) {
    return authView === 'login'
      ? <Login onSwitchToSignup={() => setAuthView('signup')} />
      : <Signup onSwitchToLogin={() => setAuthView('login')} />
  }

  function goTo(next) { setPreviousScreen(screen); setScreen(next) }

  function handleNavigation(key) {
    if (key === 'post') goTo('post')
    else setScreen(key)
  }

  function openBook(book) { setSelectedBook(book); goTo('detail') }
  function openChat(book) { setChatBook(book); setChatConversation(null); goTo('chat') }
  function openConversation(conv) { setChatConversation(conv); setChatBook(conv.book); goTo('chat') }
  function openReport(profileObj) { setTargetUser(profileObj); goTo('report') }
  function openBlock(profileObj) { setTargetUser(profileObj); goTo('block') }
  function openRate(profileObj) { setTargetUser(profileObj); goTo('rate') }

  const navTab = NAV_SCREENS.includes(screen) ? screen : null

  return (
    <Suspense fallback={<Splash />}>
      <div className="relative">

        {screen === 'post' && (
          <PostBook onBack={() => setScreen('home')} onPosted={() => setScreen('mylistings')} />
        )}
        {screen === 'edit' && editingBook && (
          <PostBook editBook={editingBook} onBack={() => setScreen(previousScreen)} onPosted={() => { setEditingBook(null); setScreen('mylistings') }} />
        )}
        {screen === 'detail' && selectedBook && (
          <BookDetail
            book={selectedBook}
            onBack={() => setScreen(previousScreen)}
            onChat={openChat}
            onReport={(book) => openReport({ id: book.seller_id, full_name: book.profiles?.full_name })}
            onEdit={(book) => { setEditingBook(book); goTo('edit') }}
            onRemoved={() => setScreen('mylistings')}
          />
        )}
        {screen === 'chat' && (chatBook || chatConversation) && (
          <Chat
            book={chatBook}
            existingConversation={chatConversation}
            onBack={() => { setChatBook(null); setChatConversation(null); setScreen(chatConversation ? 'inbox' : 'detail') }}
            onReportUser={openReport}
            onBlockUser={openBlock}
            onRateUser={openRate}
            onMarkRead={markAllRead}
          />
        )}
        {screen === 'report' && targetUser && (
          <ReportUser reportedUserId={targetUser.id} reportedUserName={targetUser.full_name} onBack={() => setScreen(previousScreen)} onSubmitted={() => setScreen('home')} />
        )}
        {screen === 'block' && targetUser && (
          <BlockUser blockedUserId={targetUser.id} blockedUserName={targetUser.full_name} onBack={() => setScreen(previousScreen)} onBlocked={() => setScreen('home')} />
        )}
        {screen === 'rate' && targetUser && (
          <RateUser book={chatBook || selectedBook} ratedUserId={targetUser.id} ratedUserName={targetUser.full_name} onBack={() => setScreen(previousScreen)} onSubmitted={() => setScreen('home')} />
        )}

        {/* Persistent screens */}
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
          <Inbox isActive={screen === 'inbox'} onBack={() => setScreen('home')} onOpenConversation={openConversation} onMarkRead={markAllRead} />
        </div>
        <div className={screen === 'mylistings' ? 'block' : 'hidden'}>
          <MyListings
            isActive={screen === 'mylistings'}
            onOpenBook={openBook}
            onEditBook={(book) => { setEditingBook(book); goTo('edit') }}
          />
        </div>
        <div className={screen === 'profile' ? 'block' : 'hidden'}>
          <Profile isActive={screen === 'profile'} onBack={() => setScreen('home')} onOpenBook={openBook} onEditBook={(book) => { setEditingBook(book); goTo('edit') }} />
        </div>

        {NAV_SCREENS.includes(screen) && (
          <>
            <BottomNav active={navTab} onNavigate={handleNavigation} unreadCount={unreadCount} />
            <InstallPrompt />
          </>
        )}
      </div>
    </Suspense>
  )
}

function App() {
  return <AuthProvider><AppContent /></AuthProvider>
}

export default App
