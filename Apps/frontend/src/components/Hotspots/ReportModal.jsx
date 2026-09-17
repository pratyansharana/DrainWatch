import React, { useState } from 'react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { AlertTriangle, Send, MapPin } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, onSubmitReport }) {
  const [locationName, setLocationName] = useState('');
  const [waterDepth, setWaterDepth] = useState('45');
  const [clearanceIssue, setClearanceIssue] = useState('Light vehicles stalling; only high-clearance buses passing.');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!locationName.trim()) {
      setError('Please provide the location or underpass name.');
      return;
    }

    const depthNum = parseInt(waterDepth, 10);
    if (isNaN(depthNum) || depthNum <= 0) {
      setError('Please provide a valid water depth measurement in centimeters.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await onSubmitReport({
        citizen_name: 'Officer / Field Reporter',
        citizen_phone: '+91-11-2383-8888',
        location_name: locationName.trim(),
        water_depth_cm: depthNum,
        clearance_issue: clearanceIssue,
        description: description.trim() || 'Field report submitted via Flood & Furious Command Desk.',
        urgency: depthNum >= 70 ? 'CRITICAL' : depthNum >= 40 ? 'HIGH' : 'MODERATE',
        coordinates: [77.222 + (Math.random() - 0.5) * 0.05, 28.636 + (Math.random() - 0.5) * 0.05]
      });

      // Reset form
      setLocationName('');
      setWaterDepth('45');
      setDescription('');
      onClose();
    } catch (err) {
      setError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Waterlogged Location"
      description="Submissions are immediately dispatched to DDMA, Delhi Traffic Police, and PWD dewatering pumps."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Location Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Location or Underpass Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. Minto Bridge, Tilak Bridge Underpass"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
              required
            />
          </div>
        </div>

        {/* Water Depth (cm) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Estimated Water Depth (cm) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="5"
              max="250"
              value={waterDepth}
              onChange={(e) => setWaterDepth(e.target.value)}
              className="w-28 px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
              required
            />
            <span className="text-xs text-slate-500 font-medium">centimeters</span>
          </div>
        </div>

        {/* Ground Clearance Impact */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Vehicle Passage & Ground Clearance Advisory
          </label>
          <select
            value={clearanceIssue}
            onChange={(e) => setClearanceIssue(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition font-medium text-slate-800"
          >
            <option value="Road completely blocked; all civilian traffic stalled.">
              Road completely closed; all traffic stalled
            </option>
            <option value="Sedans & hatchbacks stalling; minimum 85cm clearance required.">
              Sedans stalling; minimum 85cm clearance required
            </option>
            <option value="Slow movement; light water accumulation on curbs.">
              Slow movement; light water accumulation on curbs
            </option>
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Additional Observations / Sump Conditions
          </label>
          <textarea
            rows={3}
            placeholder="Describe pump operation, sewer backflow, or trapped vehicles..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition resize-none leading-relaxed"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={submitting} icon={Send}>
            Submit Incident Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
