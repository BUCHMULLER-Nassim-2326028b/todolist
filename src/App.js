import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [relations, setRelations] = useState([]);

  const [viewMode, setViewMode] = useState('in-progress');
  const [sortCriteria, setSortCriteria] = useState('date_echeance');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('task');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


  // tentative de localStorage, je crois que ça marche pas
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    const savedCategories = localStorage.getItem('categories');
    const savedRelations = localStorage.getItem('relations');

    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedCategories) setCategories(JSON.parse(savedCategories));
    if (savedRelations) setRelations(JSON.parse(savedRelations));
  }, []);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('relations', JSON.stringify(relations));
  }, [relations]);


  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    date_creation: new Date().toISOString().split('T')[0],
    date_echeance: '',
    done: false,
    urgent: false,
    contacts: [],
    categories: []
  });

  const [newCategory, setNewCategory] = useState({
    title: '',
    description: '',
    color: 'blue',
    icon: ''
  });

  const availableColors = ['blue', 'green', 'red', 'orange', 'pink', 'purple', 'bluesky'];

  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const fabMenuRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (fabMenuRef.current && !fabMenuRef.current.contains(event.target)) {
        setShowFabMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const exportData = () => {
    const dataToExport = {
      taches: tasks,
      categories: categories,
      relations: relations
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-list-export-${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (data.taches && Array.isArray(data.taches)) {
          setTasks(data.taches);
        }

        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }

        if (data.relations && Array.isArray(data.relations)) {
          setRelations(data.relations);
        }
      } catch (error) {
        alert("Le fichier importé n'est pas valide.");
        console.error(error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const getFilteredAndSortedTasks = () => {
    let filtered = [...tasks];

    if (viewMode === 'in-progress') {
      filtered = filtered.filter(task => !task.done);
    } else if (viewMode === 'completed') {
      filtered = filtered.filter(task => task.done);
    } else {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(task => {
        const creationDate = new Date(task.date_creation);
        return creationDate > oneWeekAgo || !task.done;
      });
    }

    if (categoryFilter) {
      const taskIdsWithCategory = relations
          .filter(rel => rel.categorie === categoryFilter)
          .map(rel => rel.tache);

      filtered = filtered.filter(task => taskIdsWithCategory.includes(task.id));
    }


    if (searchTerm.length >= 3) {
      filtered = filtered.filter(task =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      if (sortCriteria === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortCriteria === 'date_echeance') {
        if (!a.date_echeance) return 1;
        if (!b.date_echeance) return -1;
        return new Date(a.date_echeance) - new Date(b.date_echeance);
      } else {
        return new Date(b.date_creation) - new Date(a.date_creation);
      }
    });
  };

  const getTaskCategories = (taskId) => {
    const taskRelations = relations.filter(rel => rel.tache === taskId);
    return taskRelations.map(rel => categories.find(cat => cat.id === rel.categorie)).filter(Boolean);
  };

  const openFormModal = (type) => {
    setModalType(type);
    setShowModal(true);
    setShowFabMenu(false);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();

    if (newTask.title.length < 5) {
      alert("Veuillez saisir 5 caractères ou plus");
      return;
    }

    const taskId = parseInt(Math.random() * 1000);

    const task = {
      id: taskId,
      title: newTask.title,
      description: newTask.description,
      date_creation: newTask.date_creation,
      date_echeance: newTask.date_echeance,
      done: false,
      urgent: newTask.urgent,
      contacts: newTask.contacts || []
    };

    // Create relations for selected categories
    const newRelations = newTask.categories.map(categoryId => ({
      tache: taskId,
      categorie: categoryId
    }));

    setTasks([...tasks, task]);
    setRelations([...relations, ...newRelations]);

    setNewTask({
      title: '',
      description: '',
      date_creation: new Date().toISOString().split('T')[0],
      date_echeance: '',
      done: false,
      urgent: false,
      contacts: [],
      categories: []
    });
    setShowModal(false);
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();

    if (newCategory.title.length < 3) {
      alert("Veuillez saisir 3 caractères ou plus");
      return;
    }

    const categoryId = parseInt(Math.random() * 1000);

    const category = {
      id: categoryId,
      title: newCategory.title,
      description: newCategory.description,
      color: newCategory.color,
      icon: newCategory.icon || ""
    };

    setCategories([...categories, category]);
    setNewCategory({
      title: '',
      description: '',
      color: 'blue',
      icon: ''
    });
    setShowModal(false);
  };

  const toggleTaskStatus = (taskId) => {
    setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, done: !task.done } : task
    ));
  };

  const deleteTask = (taskId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      setTasks(tasks.filter(task => task.id !== taskId));
      setRelations(relations.filter(rel => rel.tache !== taskId));
    }
  };

  const resetApp = () => {
    if (window.confirm('Souhaitez vous réinitialiser l\'application ?')) {
      setTasks([]);
      setCategories([]);
      setRelations([]);
      setCategoryFilter(null);
      setSearchTerm('');
    }
  };

  const toggleCategoryInNewTask = (categoryId) => {
    setNewTask(prev => {
      if (prev.categories.includes(categoryId)) {
        return {
          ...prev,
          categories: prev.categories.filter(id => id !== categoryId)
        };
      } else {
        return {
          ...prev,
          categories: [...prev.categories, categoryId]
        };
      }
    });
  };

  const fileInputRef = useRef(null);

  return (
      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <div className="mobile-menu-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <div className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>

            <div className="search-bar mobile-search">
              <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />

              {categoryFilter && (
                  <div className="active-filter">
                    <span>{categories.find(cat => cat.id === categoryFilter)?.title}</span>
                    <button onClick={() => setCategoryFilter(null)}>×</button>
                  </div>
              )}
            </div>
          </div>

          <h1 className="desktop-title">ToDo List</h1>

          <div className="header-buttons">
            <button onClick={() => fileInputRef.current.click()}>Importer</button>
            <button onClick={exportData}>Exporter</button>
            <button className="reset-btn" onClick={resetApp}>Réinitialiser</button>
            <input
                type="file"
                ref={fileInputRef}
                style={{display: 'none'}}
                accept=".json"
                onChange={importData}
            />
          </div>
        </header>

        <div
            className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(false)}>
        </div>
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <button className="mobile-menu-item" onClick={() => fileInputRef.current.click()}>Importer</button>
          <button className="mobile-menu-item" onClick={exportData}>Exporter</button>
          <button className="mobile-menu-item" onClick={resetApp}>Réinitialiser</button>
        </div>

        <div className="controls">
          <div className="view-controls">
            <div className="view-slider-container">
              <button
                  className={`view-btn ${viewMode === 'in-progress' ? 'active' : ''}`}
                  onClick={() => setViewMode('in-progress')}
              >
                En cours
              </button>
              <button
                  className={`view-btn ${viewMode === 'completed' ? 'active' : ''}`}
                  onClick={() => setViewMode('completed')}
              >
                Terminées
              </button>
              <div
                  className="view-slider"
                  style={{transform: viewMode === 'completed' ? 'translateX(100%)' : 'translateX(0)'}}
              ></div>
            </div>
          </div>

          <div className="sort-filter">
            <button
                className="filter-btn"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
            >
              Trier
              par {sortCriteria === 'title' ? 'titre' : sortCriteria === 'date_echeance' ? 'échéance' : 'création'} ▼
            </button>

            {showSortDropdown && (
                <div className="sort-dropdown-container">
                  <div className="sort-dropdown">
                    <button onClick={() => {
                      setSortCriteria('title');
                      setShowSortDropdown(false);
                    }}>
                      Titre
                    </button>
                    <button onClick={() => {
                      setSortCriteria('date_echeance');
                      setShowSortDropdown(false);
                    }}>
                      Date d'échéance
                    </button>
                    <button onClick={() => {
                      setSortCriteria('date_creation');
                      setShowSortDropdown(false);
                    }}>
                      Date de création
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>

        <div className="search-bar">
          <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />

          {categoryFilter && (
              <div className="active-filter">
            <span>
              {categories.find(cat => cat.id === categoryFilter)?.title}
            </span>
                <button onClick={() => setCategoryFilter(null)}>×</button>
              </div>
          )}
        </div>

        <div className="tasks-container">
          {getFilteredAndSortedTasks().length > 0 ? (
              getFilteredAndSortedTasks().map(task => (
                  <div
                      key={task.id}
                      className={`task-card ${task.urgent ? 'urgent' : ''} ${task.done ? 'completed' : ''}`}
                  >
                    <div className="task-radio">
                      <div
                          className={`radio-btn ${task.done ? 'completed' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskStatus(task.id);
                          }}
                      >
                        {task.done && '✓'}
                      </div>
                    </div>

                    <div className="task-content" onClick={() => toggleTaskExpansion(task.id)}>
                      <div className="task-header">
                        <h3 className="task-title">{task.title}</h3>
                        <button className="expand-btn">
                          {expandedTasks[task.id] ? '▲' : '▼'}
                        </button>
                      </div>

                      {task.date_echeance && (
                          <p className="task-date">
                            Échéance: {new Date(task.date_echeance).toLocaleDateString()}
                          </p>
                      )}

                      {expandedTasks[task.id] && (
                          <div className="task-expanded">
                            {task.description && (
                                <div className="task-description">
                                  <p>{task.description}</p>
                                </div>
                            )}

                            <div className="task-categories">
                              {getTaskCategories(task.id).map(category => (
                                  <span
                                      key={category.id}
                                      className="category-tag"
                                      style={{backgroundColor: category.color}}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCategoryFilter(category.id);
                                      }}
                                  >
                          {category.icon} {category.title}
                        </span>
                              ))}
                              {getTaskCategories(task.id).length === 0 && (
                                  <span className="no-categories">Aucune catégorie</span>
                              )}
                            </div>

                            {task.contacts && task.contacts.length > 0 && (
                                <div className="task-contacts">
                                  <h4>Contacts:</h4>
                                  <ul>
                                    {task.contacts.map((contact, index) => (
                                        <li key={index}>{contact.name}</li>
                                    ))}
                                  </ul>
                                </div>
                            )}

                            <div className="expanded-actions">
                              <button
                                  className="submit-btn delete-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTask(task.id);
                                  }}
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                      )}
                    </div>
                  </div>
              ))
          ) : (
              <div className="empty-state">
                <p>Aucune tâche à afficher</p>
              </div>
          )}
        </div>

        <div className="fab-container" ref={fabMenuRef}>
          {showFabMenu && (
              <div className="fab-menu">
                <div className="fab-menu-item">
                  <button
                      className="mini-fab"
                      onClick={() => openFormModal('task')}
                  >
                    Tâche
                  </button>
                </div>
                <div className="fab-menu-item">
                  <button
                      className="mini-fab"
                      onClick={() => openFormModal('category')}
                  >
                    Catégorie
                  </button>
                </div>
              </div>
          )}
          <button
              className={`main-fab ${showFabMenu ? 'open' : ''}`}
              onClick={() => setShowFabMenu(!showFabMenu)}
          >
            <span className={`plus-icon ${showFabMenu ? 'rotate' : ''}`}>+</span>
          </button>
        </div>

        {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>{modalType === 'task' ? 'Nouvelle tâche' : 'Nouvelle catégorie'}</h2>
                  <button className="close-btn" onClick={() => {
                    const modal = document.querySelector('.modal');
                    modal.style.animation = 'popOut 0.2s ease forwards';
                    setTimeout(() => setShowModal(false), 200);
                  }}>×
                  </button>
                </div>

                {modalType === 'task' ? (
                    <form className="task-form" onSubmit={handleCreateTask}>
                      <div className="form-group">
                        <label>Titre</label>
                        <input
                            type="text"
                            value={newTask.title}
                            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                            required
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={newTask.description}
                            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Date d'échéance</label>
                        <input
                            type="date"
                            value={newTask.date_echeance}
                            onChange={(e) => setNewTask({...newTask, date_echeance: e.target.value})}
                        />
                      </div>
                      <div className="form-group checkbox">
                        <label>
                          <input
                              type="checkbox"
                              checked={newTask.urgent}
                              onChange={(e) => setNewTask({...newTask, urgent: e.target.checked})}
                          />
                          Urgent
                        </label>
                      </div>

                      <div className="form-group">
                        <label>Catégories</label>
                        <div className="categories-selection">
                          {categories.map(category => (
                              <div
                                  key={category.id}
                                  className={`category-option ${newTask.categories.includes(category.id) ? 'selected' : ''}`}
                                  style={{backgroundColor: category.color}}
                                  onClick={() => toggleCategoryInNewTask(category.id)}
                              >
                                {category.icon} {category.title}
                              </div>
                          ))}
                          {categories.length === 0 && <p>Aucune catégorie disponible</p>}
                        </div>
                      </div>

                      <button type="submit" className="submit-btn">Créer la tâche</button>
                    </form>
                ) : (
                    <form className="category-form" onSubmit={handleCreateCategory}>
                      <div className="form-group">
                        <label>Titre</label>
                        <input
                            type="text"
                            value={newCategory.title}
                            onChange={(e) => setNewCategory({...newCategory, title: e.target.value})}
                            required
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={newCategory.description}
                            onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                        />
                      </div>
                      <div className="form-group">
                        <label>Couleur</label>
                        <div className="color-selection">
                          {availableColors.map(color => (
                              <div
                                  key={color}
                                  className={`color-option ${newCategory.color === color ? 'selected' : ''}`}
                                  style={{backgroundColor: color}}
                                  onClick={() => setNewCategory({...newCategory, color})}
                              />
                          ))}
                        </div>
                      </div>

                      <button type="submit" className="submit-btn">Créer la catégorie</button>
                    </form>
                )}
              </div>
            </div>
        )}
      </div>
  );
}

export default App;