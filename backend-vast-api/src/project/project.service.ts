import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>
  ) {}

  async saveProject(data: any) {
    const project = new Project();
    project.data = JSON.stringify(data);
    project.createdAt = new Date().toISOString();
    const saved = await this.projectRepo.save(project);
    return saved.id;
  }
} 