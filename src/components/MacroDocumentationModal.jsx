import React from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Button } from './Button';
import { BookOpen, ExternalLink, Flame, Sparkles, Scale, Info, CheckCircle2 } from 'lucide-react';
import { DOCUMENTATION_LINKS } from '../utils/calorieCalculator';

export const MacroDocumentationModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calorie Budget & Macro Science Documentation"
      subtitle="Clinical standards, energetic densities, and Acceptable Macronutrient Distribution Ranges (AMDR)"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-xs text-secondary leading-relaxed">
        
        {/* Intro Alert Box */}
        <div className="p-3.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-xs block text-primary">Evidence-Based Nutritional Architecture</span>
            Life OS calculates your daily caloric budget and macronutrient split using the clinical <strong>Mifflin-St Jeor equation</strong> and USDA / HHS Acceptable Macronutrient Distribution Ranges (AMDR).
          </div>
        </div>

        {/* Section 1: Atwater Energy Densities */}
        <div>
          <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-2">
            <Flame className="w-4 h-4 text-amber-500" /> 1. Energy Density & Conversion Factors
          </h3>
          <p className="mb-2">
            Nutritional energy is derived from three primary macronutrients based on the standardized <strong>Atwater General Factor System</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-subtle rounded-xl border border-theme">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-primary">Protein</span>
                <Badge variant="purple" size="xs">4 kcal / gram</Badge>
              </div>
              <p className="text-[11px] text-secondary">
                Cellular repair, myofibrillar protein synthesis, immune immunoglobulins, and satiety signaling.
              </p>
            </div>

            <div className="p-3 bg-subtle rounded-xl border border-theme">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-primary">Carbohydrates</span>
                <Badge variant="emerald" size="xs">4 kcal / gram</Badge>
              </div>
              <p className="text-[11px] text-secondary">
                Primary glycolytic fuel substrate for cerebral metabolism, nervous system, and anaerobic exercise.
              </p>
            </div>

            <div className="p-3 bg-subtle rounded-xl border border-theme">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-primary">Dietary Fats</span>
                <Badge variant="amber" size="xs">9 kcal / gram</Badge>
              </div>
              <p className="text-[11px] text-secondary">
                Lipid bilayer membrane integrity, endocrine steroid hormones, and absorption of vitamins A, D, E, K.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Mifflin-St Jeor BMR & TDEE */}
        <div>
          <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-2">
            <Scale className="w-4 h-4 text-purple-500" /> 2. Clinical Body Budget Equations (BMR & TDEE)
          </h3>
          <div className="p-3 bg-subtle rounded-xl border border-theme space-y-2">
            <div>
              <span className="font-bold text-primary block text-xs">Basal Metabolic Rate (BMR):</span>
              <p className="font-mono text-[11px] text-purple-600 dark:text-purple-400 mt-0.5">
                Men: 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) + 5
              </p>
              <p className="font-mono text-[11px] text-purple-600 dark:text-purple-400">
                Women: 10 × weight(kg) + 6.25 × height(cm) - 5 × age(y) - 161
              </p>
            </div>
            <div className="pt-1.5 border-t border-theme">
              <span className="font-bold text-primary block text-xs">Total Daily Energy Expenditure (TDEE):</span>
              <p className="text-[11px] mt-0.5">
                <code className="bg-surface px-1 py-0.5 rounded border border-theme text-primary font-bold">TDEE = BMR × Activity Multiplier</code>
                <span className="ml-1.5">(1.2 for sedentary, 1.375 for light, 1.55 for moderate, 1.725 for heavy, 1.9 for athlete).</span>
              </p>
            </div>
            <div className="pt-1.5 border-t border-theme">
              <span className="font-bold text-primary block text-xs">Goal Deficit / Surplus:</span>
              <p className="text-[11px] mt-0.5">
                A deficit of 250–500 kcal produces ~0.25–0.5 kg/week of sustainable fat loss without down-regulating thyroid or metabolic adaptation.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Official External Documentation Links */}
        <div>
          <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 mb-2">
            <BookOpen className="w-4 h-4 text-emerald-500" /> 3. Official Documentation & Scientific References
          </h3>
          <p className="mb-2">
            Read the primary literature, peer-reviewed clinical data, and government health documentation:
          </p>

          <div className="space-y-2">
            {DOCUMENTATION_LINKS.map((doc, idx) => (
              <a
                key={idx}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 rounded-xl bg-subtle hover:bg-surface border border-theme transition-all duration-200 flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-primary text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {doc.title}
                    </span>
                    <Badge variant="neutral" size="xs">{doc.badge}</Badge>
                  </div>
                  <p className="text-[11px] text-secondary truncate">{doc.summary}</p>
                  <span className="text-[10px] text-muted block mt-0.5">{doc.organization}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-secondary group-hover:text-primary shrink-0 transition-transform group-hover:scale-110" />
              </a>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 border-t border-theme flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close Documentation
          </Button>
        </div>

      </div>
    </Modal>
  );
};

export default MacroDocumentationModal;
