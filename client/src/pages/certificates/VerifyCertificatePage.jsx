import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  XCircle,
  Building,
  Calendar,
  ShieldCheck,
  Search,
  ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/common/Button';

const VerifyCertificatePage = () => {
  const { certificateId } = useParams();

  const [inputCode, setInputCode] = useState(certificateId || '');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const checkValidity = async (codeToVerify) => {
    if (!codeToVerify) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get(`/certificates/verify/${codeToVerify.trim().toUpperCase()}`);
      setResult(res.data);
    } catch (err) {
      setResult({
        valid: false,
        message: err.response?.data?.message || 'Certificate not found in official registry.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (certificateId) {
      checkValidity(certificateId);
    }
  }, [certificateId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    checkValidity(inputCode);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto w-full">
        <div className="w-full space-y-8">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Official Credential Registry
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Verify authentic certificates of participation issued by Apex Institute of Technology.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. CERT-2026-A1B2C3D4"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-soft"
            />
            <Button type="submit" size="md" isLoading={isLoading} icon={Search}>
              Verify
            </Button>
          </form>

          {/* Results Display */}
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 sm:p-8 rounded-3xl border shadow-soft-lg ${
                result?.valid
                  ? 'bg-white dark:bg-slate-900 border-emerald-500/30'
                  : 'bg-white dark:bg-slate-900 border-rose-500/30'
              }`}
            >
              {result?.valid ? (
                <div className="space-y-5 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Verified Official Credential
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      {result.certificate.recipientName}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Successfully completed and participated in:
                    </p>
                    <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      "{result.certificate.eventTitle}"
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl text-left text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-semibold">{result.certificate.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Issue Date:</span>
                      <span className="font-semibold">
                        {new Date(result.certificate.issueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Credential ID:</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {result.certificate.certificateId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Security Hash:</span>
                      <span className="font-mono text-slate-500 text-[10px]">
                        {result.certificate.verificationHash}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href={`/api/certificates/download/${result.certificate.certificateId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        Download PDF Certificate
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 py-4">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Unverified Credential
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 max-w-sm mx-auto">
                    {result?.message}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificatePage;
