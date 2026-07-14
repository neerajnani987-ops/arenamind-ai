import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import type { RouteResult, PredictionResult, TranslationResult } from '../types';

/**
 * Custom hook to interface with ArenaMind API services.
 * Automatically manages request state (loading, errors) and abstracts endpoints.
 */
export function useStadiumApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chat = useCallback(async (message: string, language: string, userRole: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.chat(message, language, userRole);
      return res;
    } catch (err: any) {
      const errMsg = err.message || 'Failed to send chat message';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const translate = useCallback(async (text: string): Promise<TranslationResult> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.translate(text);
      return res;
    } catch (err: any) {
      const errMsg = err.message || 'Failed to translate announcement';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const routing = useCallback(async (startNode: string, endNode: string, routingType = 'fastest'): Promise<RouteResult> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.routing(startNode, endNode, routingType);
      return res;
    } catch (err: any) {
      const errMsg = err.message || 'Failed to calculate route';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPredictions = useCallback(async (weatherCondition: string, currentMatchSpectators: number): Promise<PredictionResult> => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getPredictions(weatherCondition, currentMatchSpectators);
      return res;
    } catch (err: any) {
      const errMsg = err.message || 'Failed to fetch predictions';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    chat,
    translate,
    routing,
    getPredictions,
  };
}
