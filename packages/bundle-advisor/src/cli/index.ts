#!/usr/bin/env node

import { Command } from 'commander'
import { analyzeCommand } from './commands/analyze.js'

const program = new Command()

program
  .name('bundle-advisor')
  .description('AI-assisted JavaScript bundle optimization')
  .version('0.0.0')

program.addCommand(analyzeCommand)

program.parse()
