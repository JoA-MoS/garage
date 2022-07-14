import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'garage-sample',
  templateUrl: './sample.component.html',
  styleUrls: ['./sample.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SampleComponent implements OnInit {
  @Input()
  public name = 'testing';
  constructor() {
    // add something later
  }

  ngOnInit(): void {
    // fix me later
    console.log('init');
  }
}
