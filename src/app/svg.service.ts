// src/app/svg.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SvgService {
  private svgPaths: string[] = [];
  private colors: string[] = ['green', 'blue', 'red', 'yellow', 'purple', 'brown', 'orange'];

  constructor() {
  }
}
