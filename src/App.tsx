import { useState, useEffect } from 'react';
import { FileText, Trash2, Info } from 'lucide-react';
import FileUpload from './components/FileUpload';
import DraftEditor from './components/DraftEditor';
import { supabase } from './lib/supabase';

interface TitleData {
  id: string;
  titleText: string;
  titleNumber: number;
}

function App() {
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [titles, setTitles] = useState<TitleData[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [drafts, setDrafts] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    if (titles.length > 0) {
      loadDrafts();
    }
  }, [titles]);

  const loadDrafts = async () => {
    const titleIds = titles.map((t) => t.id);
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .in('title_id', titleIds);

    if (error) {
      console.error('Error loading drafts:', error);
      return;
    }

    if (data) {
      const draftsMap: { [key: string]: any } = {};
      data.forEach((draft) => {
        draftsMap[draft.title_id] = draft;
      });
      setDrafts(draftsMap);
    }
  };

  const handleFileProcessed = async (name: string, type: string, recognizedTitles: string[]) => {
    setFileName(name);

    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        file_name: name,
        file_type: type,
      })
      .select()
      .single();

    if (docError) {
      console.error('Error creating document:', docError);
      return;
    }

    if (!docData) return;

    setCurrentDocumentId(docData.id);

    const titleInserts = recognizedTitles.map((title, index) => ({
      document_id: docData.id,
      title_text: title,
      title_number: index + 1,
    }));

    const { data: titleData, error: titleError } = await supabase
      .from('recognized_titles')
      .insert(titleInserts)
      .select();

    if (titleError) {
      console.error('Error creating titles:', titleError);
      return;
    }

    if (titleData) {
      const formattedTitles = titleData.map((t) => ({
        id: t.id,
        titleText: t.title_text,
        titleNumber: t.title_number,
      }));
      setTitles(formattedTitles);
    }
  };

  const clearAllDrafts = async () => {
    if (!confirm('Are you sure you want to clear all drafts? This action cannot be undone.')) {
      return;
    }

    if (currentDocumentId) {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', currentDocumentId);

      if (error) {
        console.error('Error deleting document:', error);
        return;
      }
    }

    setTitles([]);
    setCurrentDocumentId(null);
    setFileName('');
    setDrafts({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-600" size={32} />
              <h1 className="text-2xl font-bold text-gray-900">
                Document Title Recognition & Draft Editor
              </h1>
            </div>
            {titles.length > 0 && (
              <button
                onClick={clearAllDrafts}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 size={18} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileUpload onFileProcessed={handleFileProcessed} />

        {fileName && titles.length > 0 && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-blue-900">
                  Recognized {titles.length} title{titles.length > 1 ? 's' : ''} from "{fileName}"
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Use the draft editors below to write your responses. You can switch between typing
                  and handwriting modes, adjust the draft space size, and save or export your work.
                </p>
              </div>
            </div>
          </div>
        )}

        {titles.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Draft Editing Area
            </h2>
            {titles.map((title) => (
              <DraftEditor
                key={title.id}
                titleId={title.id}
                titleText={title.titleText}
                titleNumber={title.titleNumber}
                initialDraft={drafts[title.id]}
              />
            ))}
          </div>
        )}

        {titles.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-600 text-lg">
              Upload a document to get started
            </p>
            <p className="text-gray-500 text-sm mt-2">
              The system will automatically recognize titles and create draft editing spaces
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Document Title Recognition & Draft Editor - Upload documents, recognize titles, and
              create drafts with typing or handwriting
            </p>
            <p className="text-xs mt-2 text-gray-500">
              Tip: Your drafts are automatically saved to the database and can be exported as
              images or text files
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
