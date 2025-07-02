import { DynamicProductWorkflow } from '@/components/DynamicProductWorkflow';

export default function ProductWorkflowPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            GoHighLevel Product Creation Workflow
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create complete products in your GoHighLevel account with automatic image upload, 
            pricing setup, and built-in retry functionality for seamless OAuth token management.
          </p>
        </div>
        
        <DynamicProductWorkflow />
        
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium mb-2">Upload Image</h3>
              <p className="text-sm text-gray-600">Upload your product image to GoHighLevel's media library</p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-medium mb-2">Create Product</h3>
              <p className="text-sm text-gray-600">Create the product with name, description, and type</p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-medium mb-2">Attach Image</h3>
              <p className="text-sm text-gray-600">Link the uploaded image to your product</p>
            </div>
            
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <h3 className="font-medium mb-2">Add Pricing</h3>
              <p className="text-sm text-gray-600">Set up one-time or recurring pricing for your product</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Features</h2>
          <ul className="space-y-2 text-blue-800">
            <li>• Automatic OAuth token refresh if tokens expire during workflow</li>
            <li>• Retry functionality with up to 3 attempts per API call</li>
            <li>• Real-time progress tracking with detailed step-by-step feedback</li>
            <li>• Support for both one-time and recurring pricing models</li>
            <li>• Image validation and upload with 25MB file size limit</li>
            <li>• JSON-based workflow input for easy integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}