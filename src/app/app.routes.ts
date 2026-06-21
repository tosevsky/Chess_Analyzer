import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { HomeComponent } from './components/home/home';
import { GameSearch } from './components/game-search/game-search';
import { AnalysisBoard } from './components/analysis-board/analysis-board';
import { Repertoire } from './components/repertoire/repertoire';
import { RepertoireContent } from './components/repertoire-content/repertoire-content';
import { SaveConfirmationComponent } from './components/save-confirmation/save-confirmation';
import { SaveSuccessComponent } from './components/save-success/save-success';

export const routes: Routes = [
  
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'pesquisa', component: GameSearch },
  { path: 'analise', component: AnalysisBoard },
  { path: 'repertorio', component: Repertoire },
  { path: 'repertoire/:id', component: RepertoireContent },
  { path: 'save-confirmation', component: SaveConfirmationComponent },
  { path: 'save-success', component: SaveSuccessComponent },
  
  
  { path: '**', redirectTo: 'home' }
];