import { useState, useCallback } from 'react';
import DOMPurify from 'dompurify';
import useAppStore from '../store/useAppStore';

export function useScrapingQueue() {
  const workingDir = useAppStore(s => s.workingDir);
  const setProblemData = useAppStore(s => s.setProblemData);
  const addToast = useAppStore(s => s.addToast);
  const [scrapeStatuses, setScrapeStatuses] = useState({});

  const updateStatus = (problemId, status) => {
    setScrapeStatuses(prev => ({ ...prev, [problemId]: status }));
  };

  const scrapeOne = async (problemId, contestId, index) => {
    updateStatus(problemId, 'fetching');

    const scrapeResult = await window.electronAPI.fetchProblem(contestId, index);

    if (!scrapeResult.success) {
      updateStatus(problemId, 'failed');
      addToast(`Failed to fetch statement for ${problemId}. Click ↺ to retry.`, 'error');
      return { success: false, error: scrapeResult.error };
    }

    updateStatus(problemId, 'parsing');

    try {
      const res = await fetch('http://127.0.0.1:8765/agent/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          workingDir: useAppStore.getState().workingDir,
          rawHtml: scrapeResult.html,
        }),
      });

      if (!res.ok) throw new Error(`Parser returned ${res.status}`);

      const data = await res.json();

      updateStatus(problemId, 'ready');

      if (useAppStore.getState().selectedProblem === problemId) {
        if (data.problemJson && Object.keys(data.problemJson).length > 0) {
          let reloaded = data.problemJson;
          ;['statement','constraints','others'].forEach(k => {
            if (typeof reloaded[k] === 'string') reloaded[k] = DOMPurify.sanitize(reloaded[k]);
          });
          if (Array.isArray(reloaded.examples)) {
            reloaded.examples = reloaded.examples.map(ex => ({
              input: DOMPurify.sanitize(ex.input || ''),
              output: DOMPurify.sanitize(ex.output || ''),
              note: ex.note ? DOMPurify.sanitize(ex.note) : ''
            }));
          } else if (typeof reloaded.examples === 'string') {
            reloaded.examples = DOMPurify.sanitize(reloaded.examples);
          }
          setProblemData(reloaded);
        } else {
          const raw = await window.electronAPI.readFile(
            `${useAppStore.getState().workingDir}/${problemId}/problem.json`
          );
          if (raw.ok) {
            setProblemData(JSON.parse(raw.content));
          }
        }
      }

      return { success: true };
    } catch (err) {
      updateStatus(problemId, 'failed');
      addToast(`Failed to parse statement for ${problemId}. Click ↺ to retry.`, 'error');
      return { success: false, error: err.message };
    }
  };

  const scrapeQueue = useCallback(async (problems) => {
    for (const p of problems) {
      updateStatus(p.problemId, 'pending');
    }

    for (const p of problems) {
      await scrapeOne(p.problemId, p.contestId, p.index);
    }
  }, []);

  const retryOne = useCallback(async (problemId, contestId, index) => {
    await scrapeOne(problemId, contestId, index);
  }, []);

  return { scrapeStatuses, scrapeQueue, retryOne };
}
