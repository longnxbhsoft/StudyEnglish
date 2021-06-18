import React, { useContext, useEffect } from 'react';
import { View } from 'react-native';

import { Text, Card, IconProps, Icon, Layout, Input } from '@ui-kitten/components';

import { TouchableWithoutFeedback } from 'react-native';

import { AppContext, enrichDecksWithPlaceholder, TDeck, TSingleWalletWord, TSingleWord, TWordsWallet } from '../App';
import { styles } from '../styles/styles';

import { SwipeListView } from 'react-native-swipe-list-view';
import { getArticle, getCapitalizedIfNeeded } from '../utils/utils';
import { EmptyList } from './EmptyList';
import { SafeAreaView } from 'react-native-safe-area-context';
import Fuse from 'fuse.js';
import { BottomMenu } from './BottomMenu';

export const DeleteIcon = ( props: IconProps ) => <Icon { ...props } fill='#333'  width={ 32 } height={ 32 } name='trash-2-outline' />;

export const List = () => {

    const appData = useContext( AppContext );

    const {
        wordsWallet,
        hasShownAnimation,
        deviceNotchSize,
        decksData,
        setWordsWallet,
        setHasShownAnimation,
        storeData,
        storeDecksData,
        setDecksData
    } = appData;

    const [ walletSearchKeyword, setWalletSearchKeyword ] = React.useState( '' );
    const [ filteredWordsWallet, setFilteredWordsWallet ] = React.useState( [] as TWordsWallet );

    const walletFuseInstance = new Fuse( wordsWallet, {
        keys: ['de', 'en'],
        threshold: 0.2
    } );

    const updateWalletFilter = () => {
        const fuseResult = walletFuseInstance.search( walletSearchKeyword );
        setFilteredWordsWallet( fuseResult.map( ( result ) => result.item ) );
    };

    const deleteWordFromAllDecks = ( word: TSingleWord ) => {
        const decksDataClone = [ ... decksData ];

        // removing the add placeholder row
        decksDataClone.splice( -1, 1 );

        decksDataClone.forEach( ( singleDeck: TDeck ) => {
            const wordInDeckIndex = singleDeck.cards.findIndex( ( singleCard ) => {

                if ( singleCard.de === word.de && singleCard.en === word.en ) {
                    return singleCard;
                }

            }  );

            singleDeck.cards.splice( wordInDeckIndex, 1 );
        } );

        storeDecksData( decksDataClone ).then( () => {
            setDecksData( enrichDecksWithPlaceholder( decksDataClone ) );
        } );

    };

    useEffect( () => {
        updateWalletFilter();

        if ( walletSearchKeyword === '' ) {
            setFilteredWordsWallet( [] );
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ walletSearchKeyword ] );

    if ( wordsWallet.length === 0 ) {
        return <EmptyList />;
    }

    if ( wordsWallet[0].wordType === '__LOADING__WALLET__' ) {
        return null;
    }

    const wipeWalletSearch = () => {
        setWalletSearchKeyword( '' );
    };

    const renderCloseIconForWalletSearch = ( props: IconProps ) => {
        if ( walletSearchKeyword.length < 1 ) {
            return <></>;
        }

        return (
            <TouchableWithoutFeedback onPress={ wipeWalletSearch }>
                <Icon { ...props } width={ 22 } height={ 22 } fill='#ccc' name={ 'close-circle' } />
            </TouchableWithoutFeedback>
        );
    };

    const renderFilterIcon = ( props: IconProps ) => {
        return (
            <Icon { ...props } width={ 22 } height={ 22 } fill='#ccc' name={ 'search-outline' } />
        );
    };

    const wordsWalletToShow = filteredWordsWallet.length > 0 ? filteredWordsWallet : wordsWallet;

    const deleteWord = ( word: TSingleWalletWord, rowMap: any, rowKey: string ) => {

        if ( rowMap[rowKey] ) {
            rowMap[rowKey].closeRow();
        }

        const updatedWallet = wordsWallet.filter( ( singleWord ) => {
            return ( !( singleWord.de === word.de && singleWord.en === word.en ) );
        } );

        storeData( updatedWallet ).then( () => {
            setWordsWallet( updatedWallet );
        } );

        wipeWalletSearch();

        // Word will be removed as well from all the decks
        deleteWordFromAllDecks( word );

    };

    const wordsWalletWithKeys = [...wordsWalletToShow].map( ( word, index ) => {
        return {
            ...word,
            key: index.toString()
        };
    } );

    if ( !hasShownAnimation ) {
        setTimeout( ()=> { setHasShownAnimation( true ); }, 3000 );
    }

    return (
        <Layout style={ styles.megaWrap } >
            <SafeAreaView style={ [ styles.mainViewWrapper, deviceNotchSize === 0 ? styles['mainViewWrapper--extraTopSpacing'] : null ] }>
                <Layout style={ styles.listSearchWrapper } >
                    <Input
                        style={ styles.topSearchInput }
                        placeholder='Search your wallet'
                        value={ walletSearchKeyword }
                        onChangeText={ nextValue => setWalletSearchKeyword( nextValue ) }
                        size={ 'small' }
                        accessoryRight={ renderCloseIconForWalletSearch }
                        accessoryLeft={ renderFilterIcon }
                    />
                </Layout>
                <SwipeListView
                    keyboardDismissMode={ 'on-drag' }
                    previewRowKey={ hasShownAnimation ? '' : '0' }
                    previewOpenValue={ -50 }
                    showsVerticalScrollIndicator={ false }
                    data={ wordsWalletWithKeys }
                    style={ styles.cardsScrollView }
                    renderItem={ ( data ) => {
                        console.log(data);

                        return (
                            <Card
                                style={ styles.wordCard }
                            >
                                <Text>
                                    <Text
                                        style={ styles.mainWord }
                                    >
                                        { getArticle( data.item ) }
                                    </Text>
                                    <Text
                                        style={ styles.mainWord }
                                    >
                                        { getCapitalizedIfNeeded( data.item ) }
                                    </Text>
                                </Text>
                                <Text
                                    style={ styles.translationWord }
                                >
                                    { data.item.en }
                                </Text>
                            </Card>
                        ); } }
                    renderHiddenItem={ ( data, rowMap ) => (
                        <View style={ styles.deleteAction } >
                            <DeleteIcon
                                onPress={ () => { deleteWord( data.item, rowMap, data.item.key ); } }
                            />
                        </View>
                    ) }
                    rightOpenValue={ -75 }
                    disableRightSwipe={ true }
                />
            </SafeAreaView>
            <BottomMenu />
        </Layout>
    );
};
