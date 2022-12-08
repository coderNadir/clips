import { Component, OnInit, ContentChildren, AfterContentInit, QueryList } from '@angular/core';
import { TabComponent } from '../tab/tab.component';

@Component({
  selector: 'app-tabs-container',
  templateUrl: './tabs-container.component.html',
  styleUrls: ['./tabs-container.component.css']
})
export class TabsContainerComponent implements OnInit, AfterContentInit {

  // @ContentChildren(TabComponent) tabs?: QueryList<TabComponent>
  @ContentChildren(TabComponent) tabs: QueryList<TabComponent> = new QueryList()

  constructor() { }

  ngOnInit(): void {
    // console.log(this.tabs)
  }

  ngAfterContentInit(): void {
    // console.log(this.tabs)

    // -- get all active tabs
    const activeTabs = this.tabs?.filter(tab => tab.active)
    // -- if no active tabs then select first one by default
    if (!activeTabs || activeTabs.length === 0 ) {
      this.selectTab(this.tabs.first)
    }
  }

  selectTab(tab: TabComponent) {
    // -- reset any other active tab
    this.tabs.forEach(tab => tab.active = false)
    // -- set property active
    tab.active = true
    // -- prevent link from its behavior
    return false
  }

}
