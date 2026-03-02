import { useState, useRef, useEffect } from 'react';
import { Type, Pen, Eraser, Undo, Redo, Trash2, Save, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DraftEditorProps {
  titleId: string;
  titleText: string;
  titleNumber: number;
  initialDraft?: {
    id: string;
    content: string;
    mode: 'typing' | 'handwriting';
    canvas_data: string | null;
    width: number;
    height: number;
  };
}

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export default function DraftEditor({ titleId, titleText, titleNumber, initialDraft }: DraftEditorProps) {
  const [mode, setMode] = useState<'typing' | 'handwriting'>(initialDraft?.mode || 'typing');
  const [content, setContent] = useState(initialDraft?.content || '');
  const [draftWidth, setDraftWidth] = useState(initialDraft?.width || 600);
  const [draftHeight, setDraftHeight] = useState(initialDraft?.height || 300);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [draftId, setDraftId] = useState(initialDraft?.id || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (initialDraft?.canvas_data && mode === 'handwriting') {
      try {
        const loadedStrokes = JSON.parse(initialDraft.canvas_data);
        setStrokes(loadedStrokes);
        setHistory([loadedStrokes]);
        setHistoryStep(0);
      } catch (error) {
        console.error('Error loading canvas data:', error);
      }
    }
  }, [initialDraft, mode]);

  useEffect(() => {
    if (mode === 'handwriting' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      strokes.forEach((stroke) => {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        stroke.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      });
    }
  }, [strokes, mode, draftWidth, draftHeight]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentStroke({
      points: [{ x, y }],
      color: strokeColor,
      width: strokeWidth,
    });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, { x, y }],
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentStroke.color;
    ctx.lineWidth = currentStroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const points = currentStroke.points;
    const lastPoint = points[points.length - 1];

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke) {
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      setHistory([...history.slice(0, historyStep + 1), newStrokes]);
      setHistoryStep(historyStep + 1);
      setCurrentStroke(null);
    }
    setIsDrawing(false);
  };

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      setStrokes(history[historyStep - 1]);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      setStrokes(history[historyStep + 1]);
    }
  };

  const clearCanvas = () => {
    setStrokes([]);
    setHistory([[]]);
    setHistoryStep(0);
  };

  const saveDraft = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const draftData = {
        title_id: titleId,
        content: content,
        mode: mode,
        canvas_data: mode === 'handwriting' ? JSON.stringify(strokes) : null,
        width: draftWidth,
        height: draftHeight,
        updated_at: new Date().toISOString(),
      };

      if (draftId) {
        const { error } = await supabase
          .from('drafts')
          .update(draftData)
          .eq('id', draftId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('drafts')
          .insert(draftData)
          .select()
          .single();

        if (error) throw error;
        if (data) setDraftId(data.id);
      }

      setSaveMessage('Draft saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveMessage('Error saving draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportAsImage = () => {
    if (mode === 'handwriting' && canvasRef.current) {
      const link = document.createElement('a');
      link.download = `draft-${titleNumber}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = draftWidth;
      canvas.height = draftHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000000';
      ctx.font = '16px Arial';

      const lines = content.split('\n');
      lines.forEach((line, index) => {
        ctx.fillText(line, 10, 30 + index * 25);
      });

      const link = document.createElement('a');
      link.download = `draft-${titleNumber}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const exportAsText = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = `draft-${titleNumber}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const clearDraft = () => {
    if (confirm('Are you sure you want to clear this draft?')) {
      setContent('');
      clearCanvas();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-sm font-semibold text-blue-600 mb-1">
            Question {titleNumber}
          </div>
          <h3 className="text-lg font-medium text-gray-800">{titleText}</h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setMode('typing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              mode === 'typing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Type size={18} />
            <span>Typing</span>
          </button>
          <button
            onClick={() => setMode('handwriting')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              mode === 'handwriting'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Pen size={18} />
            <span>Handwriting</span>
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-sm text-gray-600">Width:</label>
          <input
            type="number"
            value={draftWidth}
            onChange={(e) => setDraftWidth(Number(e.target.value))}
            className="w-20 px-2 py-1 border border-gray-300 rounded"
            min="300"
            max="1200"
          />
          <label className="text-sm text-gray-600 ml-2">Height:</label>
          <input
            type="number"
            value={draftHeight}
            onChange={(e) => setDraftHeight(Number(e.target.value))}
            className="w-20 px-2 py-1 border border-gray-300 rounded"
            min="200"
            max="800"
          />
        </div>
      </div>

      {mode === 'handwriting' && (
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-600">Color:</label>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
            />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-600">Thickness:</label>
            <input
              type="range"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              min="1"
              max="10"
              className="w-32"
            />
            <span className="text-sm text-gray-600">{strokeWidth}px</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={historyStep <= 0}
              className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={redo}
              disabled={historyStep >= history.length - 1}
              className="flex items-center gap-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Redo size={16} />
            </button>
            <button
              onClick={clearCanvas}
              className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              <Eraser size={16} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      <div className="mb-4" style={{ width: `${draftWidth}px`, maxWidth: '100%' }}>
        {mode === 'typing' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your draft here..."
            className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            style={{ height: `${draftHeight}px` }}
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={draftWidth}
            height={draftHeight}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="border-2 border-gray-300 rounded-lg cursor-crosshair"
            style={{ touchAction: 'none' }}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={saveDraft}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Save size={18} />
          <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
        </button>
        <button
          onClick={exportAsImage}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download size={18} />
          <span>Export as Image</span>
        </button>
        {mode === 'typing' && (
          <button
            onClick={exportAsText}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            <span>Export as Text</span>
          </button>
        )}
        <button
          onClick={clearDraft}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 size={18} />
          <span>Clear Draft</span>
        </button>
      </div>

      {saveMessage && (
        <div
          className={`mt-3 px-4 py-2 rounded ${
            saveMessage.includes('Error')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {saveMessage}
        </div>
      )}
    </div>
  );
}
