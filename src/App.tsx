import { useState } from 'react';
import { FileText, Download, Copy, Wand2 } from 'lucide-react';

const SignalWriterApp = () => {
  const [inputText, setInputText] = useState('');
  const [siteInfo, setSiteInfo] = useState('');
  const [generatedSignal, setGeneratedSignal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState({
    severity: 'Medium'
  });

  const generateSignal = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);

    try {
      const prompt = `You are an expert Clinical Data Manager specializing in Risk-Based Monitoring and signal writing for clinical trials.

Transform this brief atypicality description into a comprehensive clinical signal narrative:

INPUT: "${inputText}"
${siteInfo ? `SITE INFORMATION: "${siteInfo}"` : ''}

VARIABLES TO INCORPORATE:
- Risk Severity: ${variables.severity}

Create a professional clinical signal following this structure:

SIGNAL TITLE: [Clear, specific title]

SIGNAL DESCRIPTION: [100-word high-level summary of the risk to study team]

RISK ASSESSMENT:
[Detailed explanation of the observed atypicality in clinical context, including statistical findings and their clinical interpretation. Discuss potential impact on trial integrity/patient safety]

ROOT CAUSE ANALYSIS:
[Potential underlying causes of the observed atypicality]

CORRECTIVE ACTIONS:
[Specific, time-bound actions with clear ownership and deadlines]

COMMENTS:
[Brief elaboration on subjects within the associated site responsible for making the site an outlier]

MONITORING PLAN:
[Ongoing monitoring strategy to track resolution]

IMPORTANT GUIDELINES:
${siteInfo ? `- ALWAYS use the specific site information provided: "${siteInfo}" throughout the signal, especially in the Signal Description` : '- Use "Site ABC", "Site XYZ" or similar placeholder names instead of specific site numbers'}
- Do NOT use random figures, hypothetical numbers, or specific counts
- Keep information specific to the actual risk being highlighted
- Focus on actionable intelligence rather than arbitrary statistics
${siteInfo ? `- The Signal Description MUST reference the site information: "${siteInfo}"` : ''}

Respond with a JSON object in this exact format:
{
  "title": "Signal title here",
  "description": "100-word signal description summary",
  "risk": "Combined risk assessment with statistical context and clinical interpretation",
  "rootCause": "Root cause analysis",
  "actions": "Corrective actions list",
  "comments": "Comments on subjects/factors at site",
  "monitoring": "Monitoring plan details"
}

Your entire response MUST be a single, valid JSON object. DO NOT include any text outside the JSON structure.
`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      let responseText = data.content[0].text;

      // Clean the response to handle markdown code blocks
      responseText = responseText.replace(/```json\n?/g, "").replace(/\n?```$/g, "").trim();

      const parsedResponse = JSON.parse(responseText);

      const formattedSignal = `SIGNAL TITLE:
${parsedResponse.title}

SIGNAL DESCRIPTION:
${parsedResponse.description}

RISK ASSESSMENT:
${parsedResponse.risk}

ROOT CAUSE ANALYSIS:
${parsedResponse.rootCause}

CORRECTIVE ACTIONS:
${parsedResponse.actions}

COMMENTS:
${parsedResponse.comments}

MONITORING PLAN:
${parsedResponse.monitoring}

---
Generated on: ${new Date().toLocaleDateString()}
${siteInfo ? `Site(s): ${siteInfo}` : ''}
Risk Severity: ${variables.severity}`;

      setGeneratedSignal(formattedSignal);
    } catch (error) {
      console.error('Error generating signal:', error);
      setGeneratedSignal(`Error generating signal: ${error.message}. Please try again or check your input.`);
    }

    setIsLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSignal);
  };

  const downloadSignal = () => {
    const blob = new Blob([generatedSignal], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clinical-signal.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVariableChange = (key, value) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const wordCount = inputText.split(' ').filter(word => word.length > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Central Monitoring Signal Writing Assistant</h1>
          </div>
          <p className="text-gray-600">Transform statistical anomalies into actionable clinical narratives</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Input atypicality observed at site/subject</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brief Description (Max 50 words)
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter brief description of atypicality observed from CluePoints..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={350}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Words: {wordCount}/50</span>
                <span className={wordCount > 50 ? 'text-red-500' : 'text-green-600'}>
                  {wordCount > 50 ? 'Exceeds limit' : 'Within limit'}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Information (Optional)
              </label>
              <input
                type="text"
                value={siteInfo}
                onChange={(e) => setSiteInfo(e.target.value)}
                placeholder="e.g., Site 101, Site ABC, Sites 101 and 102"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Enter site name(s) or number(s). This will be included in the generated signal.</p>
            </div>

              {/* Risk Severity Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Severity
                </label>
                <div className="flex gap-2">
                  {['High', 'Medium', 'Low'].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleVariableChange('severity', level)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        variables.severity === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateSignal}
                disabled={isLoading || inputText.trim() === '' || wordCount > 50}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    Generate Signal
                  </>
                )}
              </button>
            </div>

            {/* Output Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Generated Signal</h2>
                {generatedSignal && (
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </button>
                    <button
                      onClick={downloadSignal}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                )}
              </div>
              
              {generatedSignal ? (
                <div className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {generatedSignal}
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] flex items-center justify-center text-gray-400">
                  <p>Generated signal will appear here...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default SignalWriterApp;
