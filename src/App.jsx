import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')

  // ログイン状態の監視
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ToDo一覧の取得
  useEffect(() => {
    if (user) fetchTodos()
  }, [user])

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setTodos(data)
  }

  // サインアップ / ログイン処理
  const handleAuth = async (type) => {
    const { error } = type === 'signup' 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
  }

  // ToDoの追加
  const addTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.trim()) return
    const { error } = await supabase.from('todos').insert([{ title: newTodo }])
    if (!error) {
      setNewTodo('')
      fetchTodos()
    }
  }

  // ToDoのトグル（完了・未完了）
  const toggleTodo = async (id, is_completed) => {
    await supabase.from('todos').update({ is_completed: !is_completed }).eq('id', id)
    fetchTodos()
  }

  // ToDoの削除
  const deleteTodo = async (id) => {
    await supabase.from('todos').delete().eq('id', id)
    fetchTodos()
  }

  // ログアウト
  const handleLogout = () => supabase.auth.signOut()

  if (!user) {
    return (
      <div style={{ padding: '40px', maxWidth: '400px', margin: 'auto' }}>
        <h2>Supabase 認証ログイン</h2>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '20px', padding: '8px' }} />
        <button onClick={() => handleAuth('login')} style={{ marginRight: '10px', padding: '8px 16px' }}>ログイン</button>
        <button onClick={() => handleAuth('signup')} style={{ padding: '8px 16px' }}>新規登録</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <h2>ユーザーのToDoリストを表示する★</h2>
        <button onClick={handleLogout}>ログout</button>
      </div>
      <p style={{ color: 'gray' }}>ログイン中: {user.email}</p>

      <form onSubmit={addTodo} style={{ display: 'flex', marginBottom: '20px' }}>
        <input type="text" value={newTodo} onChange={e => setNewTodo(e.target.value)} placeholder="新しいタスクを入力" style={{ flexGrow: 1, padding: '8px' }} />
        <button type="submit" style={{ padding: '8px 16px' }}>追加</button>
      </form>

      <ul>
        {todos.map(todo => (
          <li key={todo.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ccc' }}>
            <span 
              onClick={() => toggleTodo(todo.id, todo.is_completed)} 
              style={{ textDecoration: todo.is_completed ? 'line-through' : 'none', cursor: 'pointer', flexGrow: 1 }}
            >
              {todo.title}
            </span>
            <button onClick={() => deleteTodo(todo.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>削除</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App