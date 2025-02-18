import { Controller, Post, Body } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post('save')
  async saveProject(@Body() body: any) {
    const projectId = await this.projectService.saveProject(body);
    return { projectId };
  }
} 