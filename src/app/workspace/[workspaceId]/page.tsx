interface WorkspacePageProps {
  params: {
    workspaceId: string;
  };
}

const WorkspacePage = ({ params }: WorkspacePageProps) => {
  return <div>{params.workspaceId}</div>;
};

export default WorkspacePage;
