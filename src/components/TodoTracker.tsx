import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { CheckSquare, Circle, CheckCircle2, Plus, Calendar, Edit2, Trash2, X } from 'lucide-react';
import type { TodoEntry } from '../contexts/DataContext';

export default function TodoTracker() {
  const { isDark } = useTheme();
  const { todoEntries, addTodoEntry, updateTodoEntry, deleteTodoEntry } = useData();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingId) {
      updateTodoEntry(editingId, {
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        priority: newPriority,
        due_date: newDueDate || null,
      });
      setEditingId(null);
    } else {
      addTodoEntry({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        priority: newPriority,
        due_date: newDueDate || null,
      });
    }

    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewDueDate('');
    setIsAdding(false);
  };

  const handleEdit = (todo: TodoEntry) => {
    setNewTitle(todo.title);
    setNewDescription(todo.description || '');
    setNewPriority(todo.priority);
    setNewDueDate(todo.due_date ? new Date(todo.due_date).toISOString().split('T')[0] : '');
    setEditingId(todo.id);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewDueDate('');
    setEditingId(null);
    setIsAdding(false);
  };

  const toggleComplete = (id: string, is_completed: boolean) => {
    updateTodoEntry(id, { is_completed: !is_completed });
  };

  const pendingTodos = todoEntries.filter(t => !t.is_completed).sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const completedTodos = todoEntries.filter(t => t.is_completed).sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const priorityColors = {
    high: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    medium: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  };

  const priorityGlow = {
    high: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    medium: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    low: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  };

  const textColor = isDark ? 'text-slate-100' : 'text-slate-900';
  const mutedColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-800/60' : 'bg-white/80';
  const inputBg = isDark ? 'bg-slate-900/50' : 'bg-slate-100/80';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* Header Section */}
      <div className={`p-8 rounded-3xl ${cardBg} backdrop-blur-xl border ${isDark ? 'border-slate-700/50' : 'border-white/50'} shadow-xl overflow-hidden relative`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <CheckSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${textColor} tracking-tight`}>Tasks</h1>
              <p className={mutedColor}>Manage your daily objectives</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className={`flex-1 md:flex-none px-6 py-3 rounded-2xl ${inputBg} border ${isDark ? 'border-slate-700' : 'border-slate-200'} flex flex-col items-center justify-center`}>
              <span className={`text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent`}>{pendingTodos.length}</span>
              <span className={`text-xs uppercase tracking-wider font-semibold ${mutedColor}`}>Pending</span>
            </div>
            <button
              onClick={() => {
                if (isAdding) cancelEdit();
                else setIsAdding(true);
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2 group"
            >
              {isAdding ? <X className="w-5 h-5 group-hover:rotate-90 transition-transform" /> : <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />}
              <span>{isAdding ? 'Close' : 'New Task'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <div className={`p-6 rounded-3xl ${cardBg} backdrop-blur-xl border ${isDark ? 'border-slate-700/50' : 'border-white/50'} shadow-xl animate-in slide-in-from-top-4 fade-in duration-300`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4 md:col-span-2">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${isDark ? 'border-slate-700 focus:border-indigo-500' : 'border-slate-200 focus:border-indigo-400'} outline-none transition-colors ${textColor} text-lg font-medium placeholder:text-slate-400`}
                  autoFocus
                />
                <textarea
                  placeholder="Optional description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl ${inputBg} border ${isDark ? 'border-slate-700 focus:border-indigo-500' : 'border-slate-200 focus:border-indigo-400'} outline-none transition-colors ${textColor} min-h-[80px] resize-none placeholder:text-slate-400`}
                />
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${mutedColor} px-1`}>Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      className={`flex-1 py-2.5 rounded-xl border capitalize text-sm font-medium transition-all ${
                        newPriority === p 
                          ? `${priorityColors[p]} ${priorityGlow[p]} ring-1 ring-current`
                          : `${inputBg} ${isDark ? 'border-slate-700' : 'border-slate-200'} ${mutedColor} hover:bg-slate-500/10`
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-medium ${mutedColor} px-1`}>Due Date (Optional)</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl ${inputBg} border ${isDark ? 'border-slate-700 focus:border-indigo-500' : 'border-slate-200 focus:border-indigo-400'} outline-none transition-colors ${textColor}`}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-500/20">
              <button
                type="button"
                onClick={cancelEdit}
                className={`px-5 py-2.5 rounded-xl font-medium ${mutedColor} hover:bg-slate-500/10 transition-colors`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {editingId ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="space-y-4">
          <h2 className={`text-lg font-bold ${textColor} flex items-center gap-2 px-1`}>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Active Tasks
          </h2>
          
          <div className="space-y-3">
            {pendingTodos.length === 0 ? (
              <div className={`p-8 rounded-2xl ${cardBg} border ${isDark ? 'border-slate-700/50' : 'border-slate-200'} text-center flex flex-col items-center justify-center gap-3`}>
                <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center`}>
                  <CheckCircle2 className={`w-6 h-6 ${mutedColor} opacity-50`} />
                </div>
                <p className={`${mutedColor} font-medium`}>All caught up!</p>
              </div>
            ) : (
              pendingTodos.map(todo => (
                <div 
                  key={todo.id}
                  className={`group p-4 rounded-2xl ${cardBg} backdrop-blur-md border border-l-4 ${isDark ? 'border-slate-700/50' : 'border-white/50'} hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
                  style={{ borderLeftColor: todo.priority === 'high' ? '#f43f5e' : todo.priority === 'medium' ? '#f59e0b' : '#3b82f6' }}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${todo.priority === 'high' ? 'bg-rose-500' : todo.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  
                  <div className="flex gap-4 relative z-10">
                    <button 
                      onClick={() => toggleComplete(todo.id, todo.is_completed)}
                      className={`mt-1 flex-shrink-0 text-slate-400 hover:text-indigo-500 transition-colors`}
                    >
                      <Circle className="w-6 h-6" />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-base font-semibold ${textColor} truncate`}>{todo.title}</h3>
                        <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityColors[todo.priority]}`}>
                          {todo.priority}
                        </div>
                      </div>
                      
                      {todo.description && (
                        <p className={`text-sm ${mutedColor} mt-1 line-clamp-2`}>{todo.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-3">
                        {todo.due_date && (
                          <div className={`flex items-center gap-1.5 text-xs font-medium ${new Date(todo.due_date) < new Date() ? 'text-rose-500' : mutedColor}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(todo.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(todo)} className={`p-1.5 rounded-lg hover:bg-slate-500/10 ${mutedColor} hover:text-indigo-500 transition-colors`}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteTodoEntry(todo.id)} className={`p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500/70 hover:text-rose-500 transition-colors`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="space-y-4">
          <h2 className={`text-lg font-bold ${textColor} flex items-center gap-2 px-1 opacity-70`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Completed
          </h2>
          
          <div className="space-y-3">
            {completedTodos.length === 0 ? (
              <div className={`p-6 rounded-2xl border border-dashed ${isDark ? 'border-slate-700' : 'border-slate-300'} text-center`}>
                <p className={`text-sm ${mutedColor}`}>No completed tasks yet.</p>
              </div>
            ) : (
              completedTodos.map(todo => (
                <div 
                  key={todo.id}
                  className={`group p-4 rounded-2xl ${isDark ? 'bg-slate-800/30' : 'bg-slate-50/50'} border ${isDark ? 'border-slate-700/30' : 'border-slate-200'} transition-all`}
                >
                  <div className="flex gap-4 items-start">
                    <button 
                      onClick={() => toggleComplete(todo.id, todo.is_completed)}
                      className={`mt-0.5 flex-shrink-0 text-emerald-500 transition-colors`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium ${mutedColor} line-through decoration-slate-500/30 truncate`}>{todo.title}</h3>
                    </div>
                    
                    <button onClick={() => deleteTodoEntry(todo.id)} className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-rose-500/70 hover:text-rose-500 transition-colors`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
