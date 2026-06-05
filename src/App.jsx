import { useState, useEffect, useRef } from 'react'
import { 
  Send, Plus, Trash2, Settings, Key, Sparkles, Menu, X, 
  ChevronLeft, ChevronRight, Copy, Check, RotateCcw, 
  Volume2, VolumeX, MessageSquare, Mic, Bot, User, Download, Edit
} from 'lucide-react'
import './App.css'

// Curated LLM Models from NVIDIA catalog
const MODELS = [
  { id: 'nvidia/llama-3.1-nemotron-51b-instruct', name: 'Llama 3.1 Nemotron 51B', desc: 'Default - Smart & versatile' },
  { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B Instruct', desc: 'Powerful reasoner' },
  { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct', desc: 'Fast, lightweight' },
  { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B IT', desc: 'Excellent creative writing' },
  { id: 'mistralai/mixtral-8x22b-instruct-v0.1', name: 'Mixtral 8x22B', desc: 'Great code and logic' },
  { id: 'microsoft/phi-3-medium-128k-instruct', name: 'Phi 3 Medium 128K', desc: 'Compact & efficient' }
];

// Presets for System Instructions
const PRESETS = [
  { 
    name: 'Helpful Assistant', 
    prompt: 'You are a helpful AI assistant powered by NVIDIA NIM cloud services. Keep answers clear, accurate, and concise.' 
  },
  { 
    name: 'Code Wizard', 
    prompt: 'You are an expert software engineer. Provide high-quality code blocks, explain syntax, and give clean, optimized refactors.' 
  },
  { 
    name: 'Creative Writer', 
    prompt: 'You are a creative writer. Use expressive language, rich analogies, and engaging stories to answer prompts.' 
  },
  { 
    name: 'Sarcastic Bot', 
    prompt: 'You are a highly sarcastic, witty chatbot. Answer questions correctly but with a humorous, sassy attitude.' 
  }
];

// Suggested prompt cards for empty chat rooms
const SUGGESTED_PROMPTS = [
  {
    title: "Write QuickSort in Python",
    text: "Generate a python script to sort a list using quicksort and explain how it works."
  },
  {
    title: "Explain Quantum Computing",
    text: "Explain quantum computing in simple terms for a 10-year-old child."
  },
  {
    title: "Sci-Fi Micro-story",
    text: "Write a futuristic micro-story about an AI that discovers antigravity."
  },
  {
    title: "App Ideation",
    text: "Help me brainstorm 5 unique app ideas for a 30-day web development challenge."
  }
];

function App() {
  // Key state
  const [apiKey, setApiKey] = useState(() => {
    return import.meta.env.VITE_NVIDIA_API_KEY || localStorage.getItem('nv_api_key') || '';
  });
  const [showConfig, setShowConfig] = useState(() => {
    const key = import.meta.env.VITE_NVIDIA_API_KEY || localStorage.getItem('nv_api_key') || '';
    return !key;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modelsList, setModelsList] = useState(MODELS);
  
  // Chat rooms
  const [chatRooms, setChatRooms] = useState(() => {
    const saved = localStorage.getItem('nv_chat_rooms');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat rooms, resetting", e);
      }
    }
    return [{
      id: 'default',
      title: 'General Chat',
      model: 'meta/llama-3.1-70b-instruct',
      systemPrompt: 'You are a helpful AI assistant powered by NVIDIA NIM cloud services. Keep answers clear, accurate, and concise.',
      temperature: 0.7,
      messages: [
        {
          id: 'init',
          role: 'assistant',
          content: 'Hello! I am your AI assistant running on NVIDIA NIM models. Let\'s explore what I can do together! Double-check your API key in settings if you haven\'t set it up yet.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }];
  });

  const [activeRoomId, setActiveRoomId] = useState(() => {
    return localStorage.getItem('nv_active_room_id') || 'default';
  });

  // UI state
  const [currentInput, setCurrentInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);

  // Settings Temp States
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempModel, setTempModel] = useState('');
  const [tempSystemPrompt, setTempSystemPrompt] = useState('');
  const [tempTemperature, setTempTemperature] = useState(0.7);
  const [isEditingTitle, setIsEditingTitle] = useState(null);
  const [editTitleVal, setEditTitleVal] = useState('');

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const activeRoom = chatRooms.find(r => r.id === activeRoomId) || chatRooms[0] || {
    id: 'default',
    title: 'General Chat',
    model: 'meta/llama-3.1-70b-instruct',
    systemPrompt: 'You are a helpful AI assistant powered by NVIDIA NIM cloud services.',
    temperature: 0.7,
    messages: []
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('nv_chat_rooms', JSON.stringify(chatRooms));
  }, [chatRooms]);

  useEffect(() => {
    localStorage.setItem('nv_active_room_id', activeRoomId);
  }, [activeRoomId]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoom?.messages, isGenerating]);

  // Migrate old localStorage model states to standard Llama 3.1 70B
  useEffect(() => {
    setChatRooms(prev => prev.map(room => {
      if (room.model === 'nvidia/llama-3.1-nemotron-51b-instruct') {
        return {
          ...room,
          model: 'meta/llama-3.1-70b-instruct'
        };
      }
      return room;
    }));
  }, []);

  // Expose copyToClipboard helper globally for markdown parsing
  useEffect(() => {
    window.copyToClipboard = (encodedCode, btn) => {
      const code = decodeURIComponent(encodedCode);
      navigator.clipboard.writeText(code).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Copied!';
        showToast('Code copied to clipboard');
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      });
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchAvailableModels = async (keyToUse) => {
    if (!keyToUse) return;
    try {
      const response = await fetch('/nvidia-api/v1/models', {
        headers: {
          'Authorization': `Bearer ${keyToUse}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.data) {
          const apiModels = data.data
            .map(m => {
              const parts = m.id.split('/');
              const creator = parts[0] || 'NVIDIA';
              const name = parts.slice(1).join('/') || m.id;
              
              const cleanName = name
                .replace(/-/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
                
              return {
                id: m.id,
                name: `${creator.toUpperCase()}: ${cleanName}`,
                desc: `Dynamic model - ${creator}`
              };
            })
            .sort((a, b) => a.name.localeCompare(b.name));
          
          if (apiModels.length > 0) {
            setModelsList(apiModels);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch models from NVIDIA cloud, using fallback catalog:", err);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchAvailableModels(apiKey);
    }
  }, [apiKey]);

  // Auto-align active room model with dynamically fetched models
  useEffect(() => {
    if (modelsList !== MODELS && modelsList.length > 0 && activeRoom) {
      const activeModelExists = modelsList.some(m => m.id === activeRoom.model);
      if (!activeModelExists) {
        const fallback = modelsList.find(m => m.id.includes('llama-3.1-70b-instruct'))?.id || modelsList[0].id;
        setChatRooms(prev => prev.map(room => {
          if (room.id === activeRoomId) {
            return {
              ...room,
              model: fallback
            };
          }
          return room;
        }));
        showToast(`Model adjusted to: ${fallback.split('/').pop()}`);
      }
    }
  }, [modelsList, activeRoomId]);

  // Open / Reset Settings modal values
  const openSettings = () => {
    setTempApiKey(apiKey);
    setTempModel(activeRoom.model);
    setTempSystemPrompt(activeRoom.systemPrompt);
    setTempTemperature(activeRoom.temperature);
    setShowConfig(true);
  };

  // Save Settings Changes
  const saveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('nv_api_key', tempApiKey);
    setApiKey(tempApiKey);

    // Update active room configuration
    setChatRooms(prev => prev.map(room => {
      if (room.id === activeRoomId) {
        return {
          ...room,
          model: tempModel,
          systemPrompt: tempSystemPrompt,
          temperature: parseFloat(tempTemperature)
        };
      }
      return room;
    }));

    setShowConfig(false);
    showToast('Settings saved successfully');
  };

  // Create new chat room
  const createNewRoom = () => {
    const newId = `room_${Date.now()}`;
    const newRoom = {
      id: newId,
      title: `Conversation ${chatRooms.length + 1}`,
      model: 'nvidia/llama-3.1-nemotron-51b-instruct',
      systemPrompt: 'You are a helpful AI assistant powered by NVIDIA NIM cloud services.',
      temperature: 0.7,
      messages: [
        {
          id: `init_${newId}`,
          role: 'assistant',
          content: 'Hello! I am ready to start a new chat. Feel free to prompt me with anything you need.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    setChatRooms(prev => [...prev, newRoom]);
    setActiveRoomId(newId);
    showToast('New conversation created');
  };

  // Delete chat room
  const deleteRoom = (id, e) => {
    e.stopPropagation();
    if (chatRooms.length === 1) {
      showToast('Cannot delete the last remaining room');
      return;
    }
    const filtered = chatRooms.filter(r => r.id !== id);
    setChatRooms(filtered);
    if (activeRoomId === id) {
      setActiveRoomId(filtered[0].id);
    }
    showToast('Conversation deleted');
  };

  // Rename Room Title
  const startRenameRoom = (id, title, e) => {
    e.stopPropagation();
    setIsEditingTitle(id);
    setEditTitleVal(title);
  };

  const saveRenameRoom = (id) => {
    if (!editTitleVal.trim()) return;
    setChatRooms(prev => prev.map(r => r.id === id ? { ...r, title: editTitleVal } : r));
    setIsEditingTitle(null);
  };

  // Clear current active chat history
  const clearCurrentChat = () => {
    if (window.confirm("Are you sure you want to clear the message history for this room?")) {
      setChatRooms(prev => prev.map(room => {
        if (room.id === activeRoomId) {
          return {
            ...room,
            messages: []
          };
        }
        return room;
      }));
      showToast('Chat history cleared');
    }
  };

  // Text-To-Speech function
  const speakText = (text, e) => {
    e?.stopPropagation();
    if (!window.speechSynthesis) {
      showToast('Speech synthesis not supported in this browser');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // strip simple HTML tags & markdown symbols
    const cleanText = text
      .replace(/<[^>]*>/g, '')
      .replace(/`+[^`]+`+/g, '')
      .replace(/[*_#\-]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Download Chat as Markdown
  const downloadChat = () => {
    if (!activeRoom.messages.length) {
      showToast('No messages to download');
      return;
    }

    let markdown = `# Chat Logs: ${activeRoom.title}\n`;
    markdown += `*Model: ${activeRoom.model}*\n`;
    markdown += `*System Prompt: ${activeRoom.systemPrompt}*\n\n`;

    activeRoom.messages.forEach(m => {
      const roleName = m.role === 'user' ? 'User' : 'Assistant';
      markdown += `### **${roleName}** (${m.timestamp})\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeRoom.title.toLowerCase().replace(/\s+/g, '_')}_logs.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Logs downloaded as markdown');
  };

  // Custom Markdown & Code Highlighter Parser
  const parseMarkdownToHtml = (text) => {
    if (!text) return '';
    
    // Safety sanitization
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Format triple backtick code blocks
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    html = html.replace(codeBlockRegex, (match, lang, code) => {
      const cleanCode = code.trim();
      const language = lang || 'code';
      return `###CODEBLOCK_START###${language}###CODEBLOCK_CONTENT###${cleanCode}###CODEBLOCK_END###`;
    });

    // Split by code blocks to avoid parsing markdown rules inside code blocks
    const parts = html.split('###CODEBLOCK_START###');
    const parsedParts = parts.map((part, index) => {
      if (index === 0) {
        return parseBasicMarkdown(part);
      }
      const subParts = part.split('###CODEBLOCK_END###');
      const codeContent = subParts[0];
      const rest = subParts[1] ? parseBasicMarkdown(subParts[1]) : '';
      
      const codeHeaderAndContent = codeContent.split('###CODEBLOCK_CONTENT###');
      const lang = codeHeaderAndContent[0] || 'code';
      const code = codeHeaderAndContent[1] || '';
      
      return `<pre><div class="code-header"><span>${lang.toUpperCase()}</span><button class="code-copy-btn" onclick="window.copyToClipboard('${encodeURIComponent(code)}', this)">Copy</button></div><code>${code}</code></pre>` + rest;
    });
    
    return parsedParts.join('');
  };

  const parseBasicMarkdown = (text) => {
    let temp = text;
    // Inline code
    temp = temp.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    temp = temp.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic
    temp = temp.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Headings
    temp = temp.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    temp = temp.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    temp = temp.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bullet lists
    temp = temp.replace(/^\s*[-*+]\s+(.*)$/gim, '<li>$1</li>');
    
    // Render lines into paragraphs
    const lines = temp.split(/\n/);
    let insideList = false;
    let listItems = [];
    const processedLines = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('<li>') && trimmed.endsWith('</li>')) {
        if (!insideList) {
          insideList = true;
        }
        listItems.push(trimmed);
      } else {
        if (insideList) {
          processedLines.push(`<ul>${listItems.join('')}</ul>`);
          listItems = [];
          insideList = false;
        }
        if (trimmed) {
          if (trimmed.startsWith('<h') || trimmed.startsWith('<pre')) {
            processedLines.push(trimmed);
          } else {
            processedLines.push(`<p>${trimmed}</p>`);
          }
        }
      }
    });

    if (insideList) {
      processedLines.push(`<ul>${listItems.join('')}</ul>`);
    }

    return processedLines.join('');
  };

  // Submit Prompt to Nvidia API
  const handleSendPrompt = async (e, customText = null) => {
    if (e) e.preventDefault();
    const promptText = (customText || currentInput).trim();
    if (!promptText) return;
    if (isGenerating) return;

    if (!apiKey) {
      showToast('NVIDIA API Key is required. Please set it in settings.');
      openSettings();
      return;
    }

    // Assemble new user message
    const userMessageId = `msg_${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Append to active room
    let updatedMessages = [...activeRoom.messages, userMsg];
    
    setChatRooms(prev => prev.map(room => {
      if (room.id === activeRoomId) {
        return {
          ...room,
          messages: updatedMessages
        };
      }
      return room;
    }));

    setCurrentInput('');
    setIsGenerating(true);

    try {
      // Build Nvidia API compatible query
      const apiMessages = [
        { role: 'system', content: activeRoom.systemPrompt },
        ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      let response = await fetch('/nvidia-api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: activeRoom.model,
          messages: apiMessages,
          temperature: activeRoom.temperature,
          max_tokens: 1024,
          top_p: 1
        })
      });

      // Handle non-200 responses
      if (!response.ok) {
        // Read response body ONCE to prevent double-read TypeError crashes
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || errData.detail || errData.message || '';
        
        const isModelNotFoundError = response.status === 404 || 
                                     errMsg.includes('Not found for account') || 
                                     errMsg.includes('not found') ||
                                     errMsg.includes('Function');
        
        if (isModelNotFoundError) {
          const fallback = 'meta/llama-3.1-70b-instruct';
          if (activeRoom.model !== fallback) {
            console.log(`Auto-retrying prompt with fallback model: ${fallback}`);
            
            // Update active room state model
            setChatRooms(prev => prev.map(room => {
              if (room.id === activeRoomId) {
                return { ...room, model: fallback };
              }
              return room;
            }));
            showToast(`Adjusting model to: ${fallback.split('/').pop()}`);
            
            // Fetch again with fallback
            response = await fetch('/nvidia-api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: fallback,
                messages: apiMessages,
                temperature: activeRoom.temperature,
                max_tokens: 1024,
                top_p: 1
              })
            });
            
            // If fallback also fails, read and throw its error
            if (!response.ok) {
              const retryErrData = await response.json().catch(() => ({}));
              const retryErrMsg = retryErrData.error?.message || retryErrData.detail || retryErrData.message || `API error (HTTP ${response.status})`;
              throw new Error(retryErrMsg);
            }
          } else {
            throw new Error(errMsg || `API error (HTTP ${response.status})`);
          }
        } else {
          if (response.status === 401) {
            throw new Error('Unauthorized: Please verify that your NVIDIA API key is valid.');
          } else {
            throw new Error(errMsg || `API error (HTTP ${response.status})`);
          }
        }
      }

      const data = await response.json();
      const assistantText = data.choices[0].message.content;

      const assistantMsg = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatRooms(prev => prev.map(room => {
        if (room.id === activeRoomId) {
          return {
            ...room,
            messages: [...room.messages, assistantMsg]
          };
        }
        return room;
      }));

      // Speak result if enabled
      if (speechEnabled) {
        speakText(assistantText);
      }

    } catch (err) {
      console.error(err);
      
      const systemErrorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Error connecting to NVIDIA NIM**: ${err.message}. Please check your internet connection or API Key.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };

      setChatRooms(prev => prev.map(room => {
        if (room.id === activeRoomId) {
          return {
            ...room,
            messages: [...room.messages, systemErrorMsg]
          };
        }
        return room;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <Sparkles className="logo-icon" />
          <h1 className="logo-text">NVIDIA NIM <span>CHAT</span></h1>
        </div>

        <button className="new-chat-btn" onClick={createNewRoom}>
          <Plus size={16} /> New Chat
        </button>

        <div className="rooms-list">
          {chatRooms.map(room => (
            <div 
              key={room.id} 
              className={`room-item ${room.id === activeRoomId ? 'active' : ''}`}
              onClick={() => setActiveRoomId(room.id)}
            >
              <div className="room-title-wrapper">
                <MessageSquare size={16} className="text-secondary" />
                {isEditingTitle === room.id ? (
                  <input
                    type="text"
                    className="form-input"
                    value={editTitleVal}
                    onChange={(e) => setEditTitleVal(e.target.value)}
                    onBlur={() => saveRenameRoom(room.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRenameRoom(room.id);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="room-title">{room.title}</span>
                )}
              </div>
              <div className="room-actions">
                <button 
                  className="room-action-btn"
                  onClick={(e) => startRenameRoom(room.id, room.title, e)}
                  title="Rename"
                >
                  <Edit size={14} />
                </button>
                <button 
                  className="room-action-btn delete"
                  onClick={(e) => deleteRoom(room.id, e)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="api-status-card">
            <span>API Key Status</span>
            <div className="api-status-indicator">
              <span className={`status-dot ${apiKey ? 'valid' : 'missing'}`}></span>
              <span>{apiKey ? 'Configured' : 'Missing'}</span>
            </div>
          </div>

          <button className="settings-btn" onClick={openSettings}>
            <Settings size={18} /> API & Model Settings
          </button>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="chat-area">
        {/* Header toolbar */}
        <header className="chat-header">
          <div className="header-left">
            <button 
              className="sidebar-toggle-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div className="header-title-container">
              <span className="header-title">{activeRoom.title}</span>
              <span className="model-badge">
                Model: <span>{modelsList.find(m => m.id === activeRoom.model)?.name || activeRoom.model}</span>
              </span>
            </div>
          </div>

          <div className="header-right">
            <button className="header-action-btn" onClick={downloadChat} title="Export logs as Markdown">
              <Download size={18} />
            </button>
            <button className="header-action-btn" onClick={clearCurrentChat} title="Clear history">
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        {/* Message feed */}
        <div className="messages-container">
          {activeRoom.messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-logo">🟢</div>
              <h2>Accelerate with NVIDIA NIM</h2>
              <p>
                Experience low-latency inference on world-class generative models powered by NVIDIA Cloud APIs. Get started by typing a query below or selecting one of the suggested prompts.
              </p>
              
              <div className="suggested-prompts-grid">
                {SUGGESTED_PROMPTS.map((sp, idx) => (
                  <div 
                    key={idx} 
                    className="prompt-card"
                    onClick={() => handleSendPrompt(null, sp.text)}
                  >
                    <h4>{sp.title}</h4>
                    <p>{sp.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            activeRoom.messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.role}`}>
                <div className="message-container">
                  <div className="avatar">
                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className="message-bubble-wrapper">
                    <div 
                      className="message-bubble" 
                      dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(msg.content) }}
                    />
                    <div className="message-info">
                      <span>{msg.timestamp}</span>
                      {msg.role === 'assistant' && (
                        <button 
                          className="speaker-btn" 
                          onClick={(e) => speakText(msg.content, e)}
                          title="Read message out loud"
                        >
                          <Volume2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {isGenerating && (
            <div className="message-row assistant">
              <div className="message-container">
                <div className="avatar">
                  <Bot size={18} />
                </div>
                <div className="message-bubble-wrapper">
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="chat-input-container">
          <form className="chat-input-form" onSubmit={handleSendPrompt}>
            <div className="input-actions-left">
              <button 
                type="button" 
                className={`input-action-btn ${speechEnabled ? 'active' : ''}`}
                onClick={() => {
                  setSpeechEnabled(!speechEnabled);
                  showToast(speechEnabled ? 'Auto text-to-speech disabled' : 'Auto text-to-speech enabled');
                }}
                title="Toggle Auto Read-Out-Loud"
              >
                {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>

            <textarea
              ref={chatInputRef}
              className="chat-textarea"
              placeholder="Ask anything..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt(e);
                }
              }}
            />

            <button type="submit" className="send-btn" disabled={!currentInput.trim() || isGenerating}>
              <Send size={16} />
            </button>
          </form>
          <div className="input-disclaimer">
            Powered by NVIDIA Cloud endpoints. Ensure your NVIDIA API key is configured.
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showConfig && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={saveSettings}>
            <div className="modal-header">
              <h3 className="modal-title">
                <Key className="text-primary" size={20} /> NIM API Settings
              </h3>
              {apiKey && (
                <button type="button" className="modal-close-btn" onClick={() => setShowConfig(false)}>
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">NVIDIA API Key</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Paste your nvapi-... key here"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  required
                />
                <p className="form-helper">
                  Get your free API key and 1000 credits at <a href="https://build.nvidia.com" target="_blank" rel="noopener noreferrer">build.nvidia.com</a>.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Default LLM Model</label>
                <select 
                  className="form-select"
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                >
                  {modelsList.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div className="form-label">System Instruction Presets</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {PRESETS.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      className="settings-btn"
                      style={{ fontSize: '0.8rem', padding: '6px' }}
                      onClick={() => setTempSystemPrompt(p.prompt)}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">System Prompt</label>
                <textarea
                  className="form-input"
                  style={{ height: '80px', resize: 'none', fontSize: '0.85rem' }}
                  value={tempSystemPrompt}
                  onChange={(e) => setTempSystemPrompt(e.target.value)}
                  placeholder="Define helper instructions"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Temperature: {tempTemperature}</label>
                </div>
                <input
                  type="range"
                  className="form-range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
                  value={tempTemperature}
                  onChange={(e) => setTempTemperature(e.target.value)}
                />
                <div className="range-values">
                  <span>Precise (0.1)</span>
                  <span>Creative (1.5)</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {apiKey && (
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfig(false)}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary">
                Save & Close
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating toast notification */}
      {toastMessage && (
        <div className="toast">
          <Check size={16} className="text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
