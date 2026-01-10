import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectForm } from '@/components/ProjectForm';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const { projects, tasks, addProject, getProjectTasks } = useProjects();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        <header className="mb-10">
          <h1 className="text-5xl font-bold text-foreground mb-2">Tus Proyectos</h1>
          <p className="text-muted-foreground">Organiza y gestiona tus tareas por proyecto</p>
        </header>

        {projects.length > 0 ? (
          <>
            <div className="flex justify-end mb-6">
              <Button onClick={() => setFormOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo proyecto
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  tasks={getProjectTasks(project.id)}
                  onClick={() => navigate(`/project/${project.id}`)}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState type="projects" onAction={() => setFormOpen(true)} />
        )}
      </div>

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={addProject}
      />
    </div>
  );
};

export default Index;
