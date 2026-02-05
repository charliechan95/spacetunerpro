import React, { useState } from 'react';
import { NoteDefinition, ScaleDefinition } from '../types';
import { NOTE_NAMES } from '../constants';
import { Plus, Trash2, Save, X, Minus } from 'lucide-react';

interface Props {
  onSave: (scale: ScaleDefinition) => void;
  onClose: () => void;
}

const CustomScaleBuilder: React.FC<Props> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState<NoteDefinition[]>([{ name: 'D', octave: 3 }]);

  const addNote = () => {
    const lastNote = notes[notes.length - 1];
    setNotes([...notes, { ...lastNote }]);
  };

  const removeNote = (index: number) => {
    if (notes.length > 1) {
      setNotes(notes.filter((_, i) => i !== index));
    }
  };

  const updateNote = (index: number, field: keyof NoteDefinition, value: string | number) => {
    const newNotes = [...notes];
    newNotes[index] = { ...newNotes[index], [field]: value };
    setNotes(newNotes);
  };

  const adjustOctave = (index: number, delta: number) => {
      const current = notes[index].octave;
      const newVal = Math.max(0, Math.min(8, current + delta));
      updateNote(index, 'octave', newVal);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const newScale: ScaleDefinition = {
      id: `custom-${Date.now()}`,
      name,
      description: 'Custom User Scale',
      notes
    };
    onSave(newScale);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-tech text-amber-400">Build Custom Scale</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Scale Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
              placeholder="e.g. My Pygmy Scale"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-slate-400">Notes (Order matters)</label>
            {notes.map((note, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-slate-800/50 p-2 rounded">
                <span className="text-xs text-slate-500 w-8 font-mono">{idx === 0 ? 'Ding' : idx}</span>
                
                {/* Note Selector */}
                <select 
                  value={note.name}
                  onChange={(e) => updateNote(idx, 'name', e.target.value)}
                  className="bg-slate-700 text-white rounded px-2 py-1.5 flex-1"
                >
                  {NOTE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>

                {/* Octave Controls */}
                <div className="flex items-center bg-slate-700 rounded">
                    <button 
                        onClick={() => adjustOctave(idx, -1)}
                        className="px-2 py-1.5 hover:bg-slate-600 rounded-l text-slate-300"
                    >
                        <Minus size={14}/>
                    </button>
                    <span className="w-6 text-center text-sm font-mono">{note.octave}</span>
                    <button 
                        onClick={() => adjustOctave(idx, 1)}
                        className="px-2 py-1.5 hover:bg-slate-600 rounded-r text-slate-300"
                    >
                        <Plus size={14}/>
                    </button>
                </div>

                <button 
                  onClick={() => removeNote(idx)}
                  className="ml-2 text-rose-400 hover:text-rose-300 p-1.5"
                  disabled={notes.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button 
            onClick={addNote}
            className="w-full py-2 border-2 border-dashed border-slate-700 text-slate-400 rounded hover:border-slate-500 hover:text-slate-300 flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Add Note
          </button>

          <button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full py-3 bg-amber-500 text-slate-900 font-bold rounded hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            <Save size={18} /> Save Scale
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomScaleBuilder;