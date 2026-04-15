"use client";



export default function WorkspaceRequestPage({ params }: { params: { requestId: string } }) {
  const { requestId } = params;
  
  return (
    <div>
      <h1>WorkspaceRequestPage: {requestId}</h1>
    </div>
  );
}
